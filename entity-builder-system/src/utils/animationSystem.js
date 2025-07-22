import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

// アニメーションのタイプ
export const ANIMATION_TYPES = {
  WALK: 'walk',
  RUN: 'run',
  IDLE: 'idle',
  JUMP: 'jump',
  ATTACK: 'attack',
};

// キーフレームデータ
export function createKeyframe(time, boneTransforms) {
  return {
    id: uuidv4(),
    time, // 秒単位
    boneTransforms, // { boneId: { position: [], rotation: [], scale: [] } }
  };
}

// アニメーションクリップ
export function createAnimationClip(name, duration, keyframes = []) {
  return {
    id: uuidv4(),
    name,
    duration,
    keyframes,
    loop: true,
  };
}

// 歩行アニメーションの生成
export function generateWalkAnimation(bones) {
  const boneMap = new Map(bones.map(b => [b.name, b]));
  const duration = 2.0; // 2秒で1サイクル
  const keyframes = [];
  
  // キーフレーム0: 開始位置
  const keyframe0 = createKeyframe(0, {});
  
  // 各ボーンの初期位置を記録
  bones.forEach(bone => {
    keyframe0.boneTransforms[bone.id] = {
      position: [...bone.position],
      rotation: [...bone.rotation],
    };
  });
  
  // キーフレーム1: 左足前進（0.5秒）
  const keyframe1 = createKeyframe(0.5, {});
  bones.forEach(bone => {
    const transform = { 
      position: [...bone.position], 
      rotation: [...bone.rotation] 
    };
    
    // 左脚を前に
    if (bone.name === 'L_Hip') {
      transform.rotation[0] = -0.4; // 前方へ回転
    }
    if (bone.name === 'L_Knee') {
      transform.rotation[0] = 0.3;
    }
    
    // 右脚を後ろに
    if (bone.name === 'R_Hip') {
      transform.rotation[0] = 0.3;
    }
    if (bone.name === 'R_Knee') {
      transform.rotation[0] = 0.1;
    }
    
    // 腕の振り
    if (bone.name === 'L_Shoulder') {
      transform.rotation[0] = 0.2; // 左腕後ろ
    }
    if (bone.name === 'R_Shoulder') {
      transform.rotation[0] = -0.2; // 右腕前
    }
    
    // 上体の揺れ
    if (bone.name === 'Spine2') {
      transform.rotation[1] = 0.05; // 軽く左回転
    }
    
    keyframe1.boneTransforms[bone.id] = transform;
  });
  
  // キーフレーム2: 中間位置（1.0秒）
  const keyframe2 = createKeyframe(1.0, {});
  bones.forEach(bone => {
    keyframe2.boneTransforms[bone.id] = {
      position: [...bone.position],
      rotation: [...bone.rotation],
    };
  });
  
  // キーフレーム3: 右足前進（1.5秒）
  const keyframe3 = createKeyframe(1.5, {});
  bones.forEach(bone => {
    const transform = { 
      position: [...bone.position], 
      rotation: [...bone.rotation] 
    };
    
    // 右脚を前に
    if (bone.name === 'R_Hip') {
      transform.rotation[0] = -0.4;
    }
    if (bone.name === 'R_Knee') {
      transform.rotation[0] = 0.3;
    }
    
    // 左脚を後ろに
    if (bone.name === 'L_Hip') {
      transform.rotation[0] = 0.3;
    }
    if (bone.name === 'L_Knee') {
      transform.rotation[0] = 0.1;
    }
    
    // 腕の振り
    if (bone.name === 'R_Shoulder') {
      transform.rotation[0] = 0.2; // 右腕後ろ
    }
    if (bone.name === 'L_Shoulder') {
      transform.rotation[0] = -0.2; // 左腕前
    }
    
    // 上体の揺れ
    if (bone.name === 'Spine2') {
      transform.rotation[1] = -0.05; // 軽く右回転
    }
    
    keyframe3.boneTransforms[bone.id] = transform;
  });
  
  // キーフレーム4: 終了位置（2.0秒） = 開始位置
  const keyframe4 = createKeyframe(2.0, {});
  bones.forEach(bone => {
    keyframe4.boneTransforms[bone.id] = {
      position: [...bone.position],
      rotation: [...bone.rotation],
    };
  });
  
  keyframes.push(keyframe0, keyframe1, keyframe2, keyframe3, keyframe4);
  
  return createAnimationClip('Walk', duration, keyframes);
}

// アイドルアニメーションの生成
export function generateIdleAnimation(bones) {
  const duration = 3.0;
  const keyframes = [];
  
  // 呼吸のような動き
  const keyframe0 = createKeyframe(0, {});
  const keyframe1 = createKeyframe(1.5, {});
  const keyframe2 = createKeyframe(3.0, {});
  
  bones.forEach(bone => {
    // デフォルト位置
    const defaultTransform = {
      position: [...bone.position],
      rotation: [...bone.rotation],
    };
    
    keyframe0.boneTransforms[bone.id] = { ...defaultTransform };
    keyframe2.boneTransforms[bone.id] = { ...defaultTransform };
    
    // 中間フレーム
    const midTransform = { ...defaultTransform };
    
    // 胸部の上下動
    if (bone.name === 'Spine2' || bone.name === 'Spine3') {
      midTransform.position[1] = defaultTransform.position[1] + 0.02;
    }
    
    // 肩の微妙な動き
    if (bone.name === 'L_Shoulder' || bone.name === 'R_Shoulder') {
      midTransform.rotation[2] = defaultTransform.rotation[2] + 0.02;
    }
    
    keyframe1.boneTransforms[bone.id] = midTransform;
  });
  
  keyframes.push(keyframe0, keyframe1, keyframe2);
  
  return createAnimationClip('Idle', duration, keyframes);
}

// アニメーションの補間
export function interpolateKeyframes(keyframe1, keyframe2, t) {
  const result = {};
  
  Object.keys(keyframe1.boneTransforms).forEach(boneId => {
    const transform1 = keyframe1.boneTransforms[boneId];
    const transform2 = keyframe2.boneTransforms[boneId];
    
    if (!transform2) return;
    
    result[boneId] = {
      position: [
        THREE.MathUtils.lerp(transform1.position[0], transform2.position[0], t),
        THREE.MathUtils.lerp(transform1.position[1], transform2.position[1], t),
        THREE.MathUtils.lerp(transform1.position[2], transform2.position[2], t),
      ],
      rotation: [
        THREE.MathUtils.lerp(transform1.rotation[0], transform2.rotation[0], t),
        THREE.MathUtils.lerp(transform1.rotation[1], transform2.rotation[1], t),
        THREE.MathUtils.lerp(transform1.rotation[2], transform2.rotation[2], t),
      ],
    };
  });
  
  return result;
}

// アニメーションプレイヤー
export class AnimationPlayer {
  constructor() {
    this.currentClip = null;
    this.currentTime = 0;
    this.isPlaying = false;
    this.speed = 1.0;
  }
  
  play(clip) {
    this.currentClip = clip;
    this.currentTime = 0;
    this.isPlaying = true;
  }
  
  pause() {
    this.isPlaying = false;
  }
  
  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
  }
  
  update(deltaTime) {
    if (!this.isPlaying || !this.currentClip) return null;
    
    this.currentTime += deltaTime * this.speed;
    
    if (this.currentClip.loop) {
      this.currentTime = this.currentTime % this.currentClip.duration;
    } else if (this.currentTime >= this.currentClip.duration) {
      this.currentTime = this.currentClip.duration;
      this.isPlaying = false;
    }
    
    return this.getCurrentTransforms();
  }
  
  getCurrentTransforms() {
    if (!this.currentClip) return null;
    
    const keyframes = this.currentClip.keyframes;
    
    // 現在時刻の前後のキーフレームを見つける
    let prevKeyframe = keyframes[0];
    let nextKeyframe = keyframes[0];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i].time <= this.currentTime && keyframes[i + 1].time > this.currentTime) {
        prevKeyframe = keyframes[i];
        nextKeyframe = keyframes[i + 1];
        break;
      }
    }
    
    // 補間
    const timeDiff = nextKeyframe.time - prevKeyframe.time;
    const t = timeDiff > 0 ? (this.currentTime - prevKeyframe.time) / timeDiff : 0;
    
    return interpolateKeyframes(prevKeyframe, nextKeyframe, t);
  }
}