/**
 * 骰子 3D 对象管理
 */
class DiceManager {
    constructor(scene) {
        this.scene = scene;
        this.dices = [];
        this.diceSize = 1.2;
        
        // 骰子材质缓存
        this.materials = this.createMaterials();
    }

    /**
     * 创建骰子各面的材质
     */
    createMaterials() {
        const materials = [];
        
        // 骰子各面的点数布局（标准骰子对面相加为7）
        // Three.js BoxGeometry 的面顺序: +x, -x, +y, -y, +z, -z
        // 对应: 右, 左, 上, 下, 前, 后
        // 标准骰子: 1对6, 2对5, 3对4
        // 布局: 右(1), 左(6), 上(2), 下(5), 前(3), 后(4)
        const faceValues = [1, 6, 2, 5, 3, 4];
        
        for (let i = 0; i < 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            // 绘制骰子面
            this.drawDiceFace(ctx, faceValues[i]);
            
            const texture = new THREE.CanvasTexture(canvas);
            // 设置颜色空间（兼容新旧版本 Three.js）
            if (THREE.SRGBColorSpace) {
                texture.colorSpace = THREE.SRGBColorSpace;
            } else if (texture.encoding !== undefined) {
                texture.encoding = THREE.sRGBEncoding;
            }
            
            const material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.4,
                metalness: 0.1,
                bumpMap: texture,
                bumpScale: 0.02
            });
            
            materials.push(material);
        }
        
        return materials;
    }

    /**
     * 绘制单个骰子面
     */
    drawDiceFace(ctx, value) {
        const size = 256;
        
        // 背景 - 象牙白
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(0, 0, size, size);
        
        // 添加细微纹理（模拟象牙质感）
        ctx.globalAlpha = 0.05;
        for (let i = 0; i < 1000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
            ctx.fillRect(
                Math.random() * size,
                Math.random() * size,
                2, 2
            );
        }
        ctx.globalAlpha = 1;
        
        // 绘制点数
        const dotColor = value === 1 ? '#c41e3a' : '#1a1a1a';
        ctx.fillStyle = dotColor;
        
        const positions = this.getDotPositions(value);
        const dotRadius = value === 1 ? 28 : 20;
        
        positions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x * size, pos.y * size, dotRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加点的阴影效果
            ctx.beginPath();
            ctx.arc(pos.x * size + 2, pos.y * size + 2, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fill();
            ctx.fillStyle = dotColor;
        });
        
        // 绘制边框（轻微圆角效果）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, size, size);
    }

    /**
     * 获取点数的绘制位置（归一化坐标 0-1）
     */
    getDotPositions(value) {
        const positions = {
            1: [{ x: 0.5, y: 0.5 }],
            2: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.75 }],
            3: [{ x: 0.25, y: 0.25 }, { x: 0.5, y: 0.5 }, { x: 0.75, y: 0.75 }],
            4: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 }],
            5: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.5, y: 0.5 }, { x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 }],
            6: [{ x: 0.25, y: 0.2 }, { x: 0.75, y: 0.2 }, { x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }, { x: 0.25, y: 0.8 }, { x: 0.75, y: 0.8 }]
        };
        return positions[value] || positions[1];
    }

    /**
     * 创建一个骰子
     */
    createDice() {
        // 创建基础立方体几何体
        const geometry = new THREE.BoxGeometry(
            this.diceSize, 
            this.diceSize, 
            this.diceSize
        );
        
        const dice = new THREE.Mesh(geometry, this.materials);
        
        // 添加阴影
        dice.castShadow = true;
        dice.receiveShadow = true;
        
        // 存储当前值（用于后续读取结果）
        dice.userData = {
            value: 1,
            targetRotation: { x: 0, y: 0, z: 0 }
        };
        
        return dice;
    }

    /**
     * 设置骰子显示的点数
     */
    setDiceValue(dice, value) {
        dice.userData.value = value;
        
        // 根据点数设置旋转角度
        // 1点朝上: x=0, y=0
        // 6点朝上: x=Math.PI, y=0 (对面)
        // 2点朝上: x=-Math.PI/2, y=0
        // 5点朝上: x=Math.PI/2, y=0
        // 3点朝上: x=0, y=-Math.PI/2
        // 4点朝上: x=0, y=Math.PI/2
        
        const rotations = {
            1: { x: 0, y: 0, z: 0 },
            6: { x: Math.PI, y: 0, z: 0 },
            2: { x: -Math.PI / 2, y: 0, z: 0 },
            5: { x: Math.PI / 2, y: 0, z: 0 },
            3: { x: 0, y: -Math.PI / 2, z: 0 },
            4: { x: 0, y: Math.PI / 2, z: 0 }
        };
        
        const rot = rotations[value];
        dice.userData.targetRotation = { ...rot };
        
        // 添加随机微调（-15° ~ 15°）
        rot.x += (Math.random() - 0.5) * 0.5;
        rot.y += (Math.random() - 0.5) * 0.5;
        rot.z += (Math.random() - 0.5) * 0.5;
        
        return rot;
    }

    /**
     * 添加指定数量的骰子
     */
    addDices(count) {
        // 清除现有骰子
        this.clearDices();
        
        for (let i = 0; i < count; i++) {
            const dice = this.createDice();
            this.dices.push(dice);
            this.scene.add(dice);
        }
        
        this.scatterDices();
    }

    /**
     * 清除所有骰子
     */
    clearDices() {
        this.dices.forEach(dice => {
            this.scene.remove(dice);
            dice.geometry.dispose();
        });
        this.dices = [];
    }

    /**
     * 随机散布骰子（停止状态）- 确保不重叠
     */
    scatterDices() {
        const spreadX = 4.5;
        const spreadY = 3.5;
        const minDistance = this.diceSize * 1.3; // 最小间距（骰子大小的1.3倍）
        
        const positions = [];
        
        this.dices.forEach((dice, index) => {
            let x, y, z;
            let attempts = 0;
            const maxAttempts = 100;
            
            // 尝试找到不重叠的位置
            do {
                x = (Math.random() - 0.5) * spreadX;
                y = (Math.random() - 0.5) * spreadY + 0.5;
                z = (Math.random() - 0.5) * 1.5; // 减小 Z 轴范围，让骰子更集中
                
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
            
            // 保存位置
            positions.push({ x, y, z });
            dice.position.set(x, y, z);
            
            // 随机旋转（显示随机点数）
            const value = Math.floor(Math.random() * 6) + 1;
            const rot = this.setDiceValue(dice, value);
            
            dice.rotation.set(rot.x, rot.y, rot.z);
        });
    }

    /**
     * 获取所有骰子的点数结果
     */
    getResults() {
        return this.dices.map(dice => dice.userData.value);
    }

    /**
     * 准备摇骰子动画（设置随机旋转目标）
     */
    prepareRoll() {
        this.dices.forEach(dice => {
            const value = Math.floor(Math.random() * 6) + 1;
            this.setDiceValue(dice, value);
        });
    }
}
