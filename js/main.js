/**
 * 主逻辑模块
 */
class DiceApp {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.diceManager = null;
        
        // 状态
        this.diceCount = 5;
        this.isRolling = false;
        this.keepAwake = false;
        this.wakeLock = null;
        
        // 动画
        this.animationId = null;
        this.rollStartTime = 0;
        this.rollDuration = 1500; // 1.5秒
        
        // 初始化
        this.init();
        this.bindEvents();
    }

    /**
     * 初始化 Three.js 场景
     */
    init() {
        // 场景
        this.scene = new THREE.Scene();
        
        // 相机
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.set(0, 0, 12);
        this.camera.lookAt(0, 0, 0);
        
        // 渲染器
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // 灯光
        this.setupLights();
        
        // 背景
        this.setupBackground();
        
        // 骰子管理器
        this.diceManager = new DiceManager(this.scene);
        this.diceManager.addDices(this.diceCount);
        
        // 开始渲染循环
        this.animate();
    }

    /**
     * 设置灯光
     */
    setupLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // 主光源（模拟顶部灯光）
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.bias = -0.001;
        this.scene.add(mainLight);
        
        // 补光（模拟赌桌氛围）
        const fillLight = new THREE.PointLight(0x90ee90, 0.4);
        fillLight.position.set(-5, 2, 5);
        this.scene.add(fillLight);
        
        // 轮廓光
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
        rimLight.position.set(0, 5, -10);
        this.scene.add(rimLight);
    }

    /**
     * 设置背景
     */
    setupBackground() {
        // 先设置纯色背景作为 fallback
        this.scene.background = new THREE.Color(0x1a472a);
        
        // 尝试加载毛毡纹理
        const loader = new THREE.TextureLoader();
        loader.load(
            'assets/felt-texture.png',
            (texture) => {
                // 兼容新旧版本 Three.js
                if (THREE.SRGBColorSpace) {
                    texture.colorSpace = THREE.SRGBColorSpace;
                } else if (texture.encoding !== undefined) {
                    texture.encoding = THREE.sRGBEncoding;
                }
                
                // 创建背景平面
                const aspect = window.innerWidth / window.innerHeight;
                const bgGeometry = new THREE.PlaneGeometry(20 * aspect, 20);
                const bgMaterial = new THREE.MeshBasicMaterial({ 
                    map: texture,
                    depthWrite: false
                });
                const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
                bgMesh.position.z = -5;
                bgMesh.renderOrder = -1;
                this.scene.add(bgMesh);
            },
            undefined,
            (error) => {
                console.log('背景加载失败，使用纯色背景');
            }
        );
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 摇按钮
        const rollBtn = document.getElementById('roll-btn');
        rollBtn.addEventListener('click', () => this.roll());
        
        // 设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeModal = document.getElementById('close-modal');
        
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
        
        closeModal.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
        
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
        });
        
        // 骰子数量控制
        const decreaseBtn = document.getElementById('decrease-btn');
        const increaseBtn = document.getElementById('increase-btn');
        const diceCountDisplay = document.getElementById('dice-count');
        
        decreaseBtn.addEventListener('click', () => {
            if (this.diceCount > 1) {
                this.diceCount--;
                diceCountDisplay.textContent = this.diceCount;
                if (!this.isRolling) {
                    this.diceManager.addDices(this.diceCount);
                }
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            if (this.diceCount < 10) {
                this.diceCount++;
                diceCountDisplay.textContent = this.diceCount;
                if (!this.isRolling) {
                    this.diceManager.addDices(this.diceCount);
                }
            }
        });
        
        // 音效开关
        const soundToggle = document.getElementById('sound-toggle');
        soundToggle.addEventListener('change', (e) => {
            audioManager.setSoundEnabled(e.target.checked);
        });
        
        // 屏幕常亮开关
        const keepAwakeSwitch = document.getElementById('keep-awake');
        keepAwakeSwitch.addEventListener('change', (e) => {
            this.setKeepAwake(e.target.checked);
        });
        
        // 窗口大小变化
        window.addEventListener('resize', () => this.onResize());
        
        // 首次用户交互时初始化音频
        document.body.addEventListener('click', () => {
            audioManager.init();
        }, { once: true });
    }

    /**
     * 摇骰子
     */
    roll() {
        if (this.isRolling) return;
        
        this.isRolling = true;
        
        // 禁用按钮
        const rollBtn = document.getElementById('roll-btn');
        rollBtn.disabled = true;
        
        // 初始化音频并播放音效
        audioManager.init();
        audioManager.startRollingSound();
        
        // 震动（如果支持）
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50, 50, 50, 50, 50, 50]);
        }
        
        // 记录动画开始时间
        this.rollStartTime = Date.now();
        
        // 为每个骰子设置目标旋转
        this.diceManager.prepareRoll();
        
        // 生成不重叠的目标位置
        const targetPositions = this.generateNonOverlappingPositions(this.diceManager.dices.length);
        
        // 存储每个骰子的动画参数
        this.diceManager.dices.forEach((dice, index) => {
            const targetRot = dice.userData.targetRotation;
            
            // 计算起始旋转（加上多圈旋转）
            const extraRotations = 2 + Math.floor(Math.random() * 2); // 2-3圈
            dice.userData.startRotation = {
                x: dice.rotation.x,
                y: dice.rotation.y,
                z: dice.rotation.z
            };
            dice.userData.targetRotationAnimated = {
                x: targetRot.x + extraRotations * Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1),
                y: targetRot.y + extraRotations * Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1),
                z: targetRot.z + extraRotations * Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1)
            };
            
            // 存储起始位置
            dice.userData.startPosition = {
                x: dice.position.x,
                y: dice.position.y,
                z: dice.position.z
            };
            
            // 使用生成的目标位置
            dice.userData.targetPosition = targetPositions[index];
        });
    }

    /**
     * 生成不重叠的位置
     */
    generateNonOverlappingPositions(count) {
        const spreadX = 4.5;
        const spreadY = 3.5;
        const minDistance = 1.6; // 骰子大小的1.3倍以上
        
        const positions = [];
        
        for (let i = 0; i < count; i++) {
            let x, y, z;
            let attempts = 0;
            const maxAttempts = 200;
            
            do {
                x = (Math.random() - 0.5) * spreadX;
                y = (Math.random() - 0.5) * spreadY + 0.5;
                z = (Math.random() - 0.5) * 1.5;
                
                // 检查与已有位置的距离
                let tooClose = false;
                for (const pos of positions) {
                    const dx = x - pos.x;
                    const dy = y - pos.y;
                    const dz = z - pos.z;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (distance < minDistance) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose || attempts >= maxAttempts) {
                    break;
                }
                attempts++;
            } while (true);
            
            positions.push({ x, y, z });
        }
        
        return positions;
    }

    /**
     * 动画循环
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // 更新摇骰子动画
        if (this.isRolling) {
            const now = Date.now();
            const elapsed = now - this.rollStartTime;
            const progress = Math.min(elapsed / this.rollDuration, 1);
            
            // 使用 ease-out 缓动
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // 更新每个骰子
            this.diceManager.dices.forEach(dice => {
                const startRot = dice.userData.startRotation;
                const targetRot = dice.userData.targetRotationAnimated;
                const startPos = dice.userData.startPosition;
                const targetPos = dice.userData.targetPosition;
                
                // 插值旋转
                dice.rotation.x = startRot.x + (targetRot.x - startRot.x) * easeProgress;
                dice.rotation.y = startRot.y + (targetRot.y - startRot.y) * easeProgress;
                dice.rotation.z = startRot.z + (targetRot.z - startRot.z) * easeProgress;
                
                // 插值位置（带一点弹跳效果）
                let bounceY = 0;
                if (progress < 0.8) {
                    // 前半段向上抛
                    const upProgress = progress / 0.8;
                    bounceY = Math.sin(upProgress * Math.PI) * 2;
                }
                
                dice.position.x = startPos.x + (targetPos.x - startPos.x) * easeProgress;
                dice.position.y = startPos.y + (targetPos.y - startPos.y) * easeProgress + bounceY;
                dice.position.z = startPos.z + (targetPos.z - startPos.z) * easeProgress;
            });
            
            // 动画结束
            if (progress >= 1) {
                this.isRolling = false;
                
                // 立即停止音效（音画同步）
                audioManager.stopRollingSound();
                
                // 启用按钮
                const rollBtn = document.getElementById('roll-btn');
                rollBtn.disabled = false;
                
                // 时间显示已移除
                
                // 打印结果（调试用）
                const results = this.diceManager.getResults();
                console.log('摇骰子结果:', results);
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 设置屏幕常亮
     */
    async setKeepAwake(enable) {
        this.keepAwake = enable;
        
        if (enable) {
            try {
                if ('wakeLock' in navigator) {
                    this.wakeLock = await navigator.wakeLock.request('screen');
                    console.log('屏幕常亮已开启');
                }
            } catch (err) {
                console.log('屏幕常亮请求失败:', err);
            }
        } else {
            if (this.wakeLock) {
                try {
                    await this.wakeLock.release();
                    this.wakeLock = null;
                    console.log('屏幕常亮已关闭');
                } catch (err) {
                    console.log('释放屏幕常亮失败:', err);
                }
            }
        }
    }

    /**
     * 窗口大小变化处理
     */
    onResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new DiceApp();
});
