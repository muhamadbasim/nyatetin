import React, { useState, useEffect } from 'react';

interface AnimatedBalanceProps {
  balance: number;
}

const AnimatedBalance: React.FC<AnimatedBalanceProps> = ({ balance }) => {
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    const animationDuration = 1000; // 1 second
    const framesPerSecond = 60;
    const totalFrames = (animationDuration / 1000) * framesPerSecond;
    const increment = balance / totalFrames;

    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      setCurrentBalance((prev) => {
        const newBalance = prev + increment;
        if (newBalance >= balance) {
          clearInterval(counter);
          return balance;
        }
        return newBalance;
      });
      if (frame === totalFrames) {
        clearInterval(counter);
        setCurrentBalance(balance);
      }
    }, 1000 / framesPerSecond);

    return () => {
      clearInterval(counter);
    };
  }, [balance]);

  return (
    <h2 className="text-4xl font-bold">
      ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </h2>
  );
};

export default AnimatedBalance;
