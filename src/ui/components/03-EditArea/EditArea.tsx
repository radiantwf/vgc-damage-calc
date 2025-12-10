import React from "react";
import "./EditArea.css";
import Pokemon from "./01-Pokemon/Pokemon";
import Team from "./02-Team/Team";

interface EditAreaProps {
  className?: string;
}

const EditArea: React.FC<EditAreaProps> = ({ className }) => {
  return (
    <div className={`edit-area-row ${className ? className : ""}`}>
      <div className={`edit-area-container`}>
        <Pokemon isAttacker={true} />
        <Team isAttacker={true} />
      </div>
      <div className={`edit-area-container`}>
        <Pokemon isAttacker={false} />
        <Team isAttacker={false} />
      </div>
    </div>
  );
};

export default EditArea;
