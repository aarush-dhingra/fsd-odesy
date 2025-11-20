import { useEffect, useRef } from 'react';
import './RobotWithEyes.css';

export function RobotWithEyes() {
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const eyes = [leftEyeRef.current, rightEyeRef.current];

      eyes.forEach((eye) => {
        if (!eye) return;

        const eyeRect = eye.getBoundingClientRect();
        const eyeCenterX = eyeRect.left + eyeRect.width / 2;
        const eyeCenterY = eyeRect.top + eyeRect.height / 2;

        const deltaX = e.clientX - eyeCenterX;
        const deltaY = e.clientY - eyeCenterY;

        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.min(15, Math.sqrt(deltaX ** 2 + deltaY ** 2) / 20);

        const pupilX = Math.cos(angle) * distance;
        const pupilY = Math.sin(angle) * distance;

        const pupil = eye.querySelector('.pupil');
        if (pupil) {
          pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="robot-character">
      {/* Robot Head */}
      <div className="robot-head">
        {/* Antenna */}
        <div className="antenna">
          <div className="antenna-ball"></div>
        </div>

        {/* Eyes Container */}
        <div className="eyes-container">
          {/* Left Eye */}
          <div className="eye left-eye" ref={leftEyeRef}>
            <div className="pupil">
              <div className="pupil-shine"></div>
            </div>
          </div>

          {/* Right Eye */}
          <div className="eye right-eye" ref={rightEyeRef}>
            <div className="pupil">
              <div className="pupil-shine"></div>
            </div>
          </div>
        </div>

        {/* Mouth */}
        <div className="mouth">
          <div className="tooth"></div>
          <div className="tooth"></div>
          <div className="tooth"></div>
        </div>
      </div>

      {/* Robot Body */}
      <div className="robot-body">
        <div className="body-panel">
          <div className="panel-light"></div>
          <div className="panel-light"></div>
          <div className="panel-light"></div>
        </div>

        {/* Arms */}
        <div className="robot-arms">
          <div className="arm left-arm">
            <div className="hand"></div>
          </div>
          <div className="arm right-arm">
            <div className="hand"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
