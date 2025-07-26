// 武器タイプ定義

import * as THREE from 'three';

export const WeaponTypes = {
    // 基本武器
    PULSE_LASER: {
        id: 'pulse_laser',
        name: 'パルスレーザー',
        type: 'primary',
        damage: 20,
        fireRate: 100, // ms
        speed: 150,
        color: 0x00ffff,
        size: 0.2,
        sound: 'laser_shot',
        description: '標準的なエネルギー武器'
    },
    
    RAPID_FIRE: {
        id: 'rapid_fire',
        name: 'ラピッドファイア',
        type: 'primary',
        damage: 10,
        fireRate: 50,
        speed: 200,
        color: 0xffff00,
        size: 0.15,
        spread: 5, // 拡散角度
        burstCount: 3, // 3連射
        sound: 'rapid_shot',
        description: '高速連射武器'
    },
    
    PLASMA_CANNON: {
        id: 'plasma_cannon',
        name: 'プラズマキャノン',
        type: 'primary',
        damage: 50,
        fireRate: 300,
        speed: 100,
        color: 0xff00ff,
        size: 0.4,
        aoe: 10, // 爆発範囲
        sound: 'plasma_shot',
        description: '高威力エネルギー兵器'
    },
    
    // 特殊武器
    HOMING_MISSILE: {
        id: 'homing_missile',
        name: 'ホーミングミサイル',
        type: 'secondary',
        damage: 40,
        fireRate: 1000,
        speed: 80,
        color: 0xff8800,
        size: 0.3,
        homingStrength: 0.05,
        maxTurnRate: 0.1,
        fuel: 5, // 5秒間追尾
        sound: 'missile_launch',
        ammo: 20, // 弾薬制限
        description: '敵を自動追尾するミサイル'
    },
    
    SCATTER_SHOT: {
        id: 'scatter_shot',
        name: 'スキャッターショット',
        type: 'primary',
        damage: 15,
        fireRate: 200,
        speed: 120,
        color: 0x00ff00,
        size: 0.2,
        projectileCount: 5, // 5発同時発射
        spreadAngle: 30, // 拡散角度
        sound: 'scatter_shot',
        description: '広範囲散弾武器'
    },
    
    ION_BEAM: {
        id: 'ion_beam',
        name: 'イオンビーム',
        type: 'special',
        damage: 100,
        chargeTime: 2000, // 2秒チャージ
        beamDuration: 1000, // 1秒間照射
        color: 0x00ffff,
        width: 2,
        range: 200,
        sound: 'ion_charge',
        energyCost: 50,
        description: '強力な貫通ビーム兵器'
    },
    
    // 防御系武器
    SHIELD_PROJECTOR: {
        id: 'shield_projector',
        name: 'シールドプロジェクター',
        type: 'defensive',
        shieldStrength: 100,
        duration: 5000, // 5秒間
        rechargeTime: 10000, // 10秒リチャージ
        color: 0x0088ff,
        sound: 'shield_activate',
        description: '一時的なシールドを展開'
    },
    
    EMP_BLAST: {
        id: 'emp_blast',
        name: 'EMP爆弾',
        type: 'special',
        damage: 0,
        stunDuration: 3000, // 3秒スタン
        range: 50,
        fireRate: 5000,
        color: 0xffffff,
        sound: 'emp_blast',
        description: '周囲の敵を無力化'
    },
    
    // 実験的武器
    QUANTUM_TORPEDO: {
        id: 'quantum_torpedo',
        name: '量子魚雷',
        type: 'ultimate',
        damage: 200,
        fireRate: 5000,
        speed: 50,
        color: 0xff00ff,
        size: 0.6,
        quantumPhase: true, // 障害物貫通
        trackingRange: 100,
        sound: 'quantum_launch',
        ammo: 5,
        description: '障害物を貫通する追尾魚雷'
    },
    
    LASER_ARRAY: {
        id: 'laser_array',
        name: 'レーザーアレイ',
        type: 'primary',
        damage: 5,
        fireRate: 0, // 継続照射
        beamCount: 8, // 8本のビーム
        rotationSpeed: 2, // 回転速度
        color: 0xff0000,
        range: 100,
        energyDrain: 10, // エネルギー消費/秒
        sound: 'laser_array',
        description: '回転する多連装レーザー'
    }
};

// 武器のレアリティ
export const WeaponRarity = {
    COMMON: { name: 'コモン', color: 0xcccccc, priceMultiplier: 1 },
    UNCOMMON: { name: 'アンコモン', color: 0x00ff00, priceMultiplier: 1.5 },
    RARE: { name: 'レア', color: 0x0088ff, priceMultiplier: 2.5 },
    EPIC: { name: 'エピック', color: 0xff00ff, priceMultiplier: 4 },
    LEGENDARY: { name: 'レジェンダリー', color: 0xffaa00, priceMultiplier: 8 }
};

// 武器の強化タイプ
export const WeaponUpgrades = {
    DAMAGE: { name: 'ダメージ強化', maxLevel: 10, costPerLevel: 1000, bonusPerLevel: 0.1 },
    FIRE_RATE: { name: '連射速度強化', maxLevel: 10, costPerLevel: 800, bonusPerLevel: 0.08 },
    ACCURACY: { name: '精度強化', maxLevel: 5, costPerLevel: 1200, bonusPerLevel: 0.15 },
    SPECIAL: { name: '特殊効果強化', maxLevel: 3, costPerLevel: 2000, bonusPerLevel: 0.25 }
};

// 武器バランス設定
export const WeaponBalance = {
    // DPSバランス: ダメージ * (1000 / fireRate)
    // パルスレーザー: 25 * (1000/150) = 166.7 DPS
    // ラピッドファイア: 12 * 3 * (1000/80) = 450 DPS (バースト)
    // プラズマキャノン: 60 * (1000/500) = 120 DPS + AOE
    // スキャッター: 18 * 5 * (1000/250) = 360 DPS (全弾命中時)
    
    ENERGY_CONSUMPTION: {
        pulse_laser: 5,
        rapid_fire: 3,
        plasma_cannon: 15,
        scatter_shot: 8,
        ion_beam: 50,
        laser_array: 10
    },
    
    UPGRADE_SCALING: {
        damage: (base, level) => base * (1 + level * 0.1),
        fireRate: (base, level) => base * (1 - level * 0.08), // クールダウン減少
        accuracy: (spread, level) => spread * (1 - level * 0.15), // 拡散減少
        special: (value, level) => value * (1 + level * 0.25)
    }
};