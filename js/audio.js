/**
 * 音频管理器 - 使用真实骰子音效
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.intervalId = null;
        this.soundEnabled = true; // 音效开关
        
        // 音频元素
        this.rollAudio = null;
        this.landAudio = null;
        
        // 加载音频
        this.loadSounds();
    }

    /**
     * 加载音效文件
     */
    loadSounds() {
        // 骰子滚动音效（循环）
        this.rollAudio = new Audio('assets/dice-roll.mp3');
        this.rollAudio.loop = true;
        this.rollAudio.volume = 0.6;
        
        // 落地音效（使用同一个文件，但只播放一次）
        this.landAudio = new Audio('assets/dice-roll.mp3');
        this.landAudio.loop = false;
        this.landAudio.volume = 0.6;
    }

    /**
     * 初始化音频上下文（必须在用户交互后调用）
     */
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * 设置音效开关
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        if (!enabled) {
            this.stopRollingSound();
        }
    }

    /**
     * 开始播放连续的骰子碰撞声
     */
    startRollingSound() {
        if (!this.soundEnabled) return;
        if (this.isPlaying) return;

        this.isPlaying = true;
        
        // 播放循环音效
        if (this.rollAudio) {
            this.rollAudio.currentTime = 0;
            this.rollAudio.play().catch(e => console.log('音频播放失败:', e));
        }
    }

    /**
     * 停止播放（立即停止，音画同步）
     */
    stopRollingSound() {
        this.isPlaying = false;
        if (this.rollAudio) {
            // 立即停止并静音
            this.rollAudio.pause();
            this.rollAudio.currentTime = 0;
            // 强制静音防止残留声音
            this.rollAudio.volume = 0;
            // 短暂延迟后恢复音量（为下次播放做准备）
            setTimeout(() => {
                if (!this.isPlaying) {
                    this.rollAudio.volume = 0.6;
                }
            }, 100);
        }
    }

    /**
     * 播放最终落定的声音
     */
    playLandingSound() {
        if (!this.soundEnabled) return;

        // 停止循环音效
        this.stopRollingSound();
        
        // 播放落地音效（从中间开始播放，模拟不同的声音）
        if (this.landAudio) {
            this.landAudio.currentTime = 0.5;
            this.landAudio.play().catch(e => console.log('音频播放失败:', e));
        }
    }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager();
