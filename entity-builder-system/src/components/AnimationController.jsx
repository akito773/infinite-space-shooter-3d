import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useFrame } from '@react-three/fiber';
import { 
  updateAnimationTime, 
  updateBone,
  setIsPlaying 
} from '../store';
import { AnimationPlayer } from '../utils/animationSystem';

function AnimationController() {
  const dispatch = useDispatch();
  const bones = useSelector(state => state.scene.bones);
  const animations = useSelector(state => state.scene.animations);
  const currentAnimation = useSelector(state => state.scene.currentAnimation);
  const isPlaying = useSelector(state => state.scene.isPlaying);
  
  const playerRef = useRef(new AnimationPlayer());
  const lastTimeRef = useRef(0);
  
  // アニメーションの変更を検知
  useEffect(() => {
    if (currentAnimation) {
      const clip = animations.find(a => a.id === currentAnimation);
      if (clip) {
        playerRef.current.play(clip);
        if (!isPlaying) {
          playerRef.current.pause();
        }
      }
    } else {
      playerRef.current.stop();
    }
  }, [currentAnimation, animations]);
  
  // 再生/停止状態の変更を検知
  useEffect(() => {
    if (isPlaying) {
      playerRef.current.isPlaying = true;
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying]);
  
  // アニメーション更新
  useFrame((state, delta) => {
    if (!isPlaying || !currentAnimation) return;
    
    const transforms = playerRef.current.update(delta);
    
    if (transforms) {
      // ボーンの位置を更新
      Object.keys(transforms).forEach(boneId => {
        const transform = transforms[boneId];
        dispatch(updateBone({
          id: boneId,
          updates: {
            position: transform.position,
            rotation: transform.rotation,
          }
        }));
      });
      
      // アニメーション時間を更新
      dispatch(updateAnimationTime(playerRef.current.currentTime));
    }
  });
  
  return null;
}

export default AnimationController;