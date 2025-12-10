import React from "react";
import FieldCenter from "./01-FieldCenter/FieldCenter";
import FieldSide from "./02-FieldSide/FieldSide";
import "./FieldArea.css";
// 注意：FieldSide 的上下文 Provider 已在应用根部（App）中包裹，
// 此处不应再重复包裹本地 Provider，以避免产生多个独立上下文实例导致状态不一致。

interface FieldAreaProps {
  className?: string;
}

const FieldArea: React.FC<FieldAreaProps> = ({ className }) => {
  return (
    <div className="field-container">
      {/* 上下文 Provider 已在更高层包裹，这里直接使用上下文 */}
      <FieldSide isAttacker={true} />
      <FieldCenter />
      <FieldSide isAttacker={false} />
    </div>
  );
};

export default FieldArea;