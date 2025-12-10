import React from "react";
import "./ComputeArea.css";
import { DisplayPokemon } from "./DisplayPokemon/DisplayPokemon";
import { DisplayDamage } from "./DisplayDamage/DisplayDamage";
import { DamageComputeProvider } from "../../../contexts/DamageComputeContext";

interface ComputeAreaProps {
  className?: string;
}

export const ComputeArea: React.FC<ComputeAreaProps> = ({ className }) => {
  return (
    <DamageComputeProvider>
      <div className={`compute-area ${className || ""}`}>
        <div className="compute-area__pokemon-row">
          <DisplayPokemon isAttacker={true} />
          <DisplayPokemon isAttacker={false} />
        </div>
        <div className="compute-area__damage-row">
          <DisplayDamage />
        </div>
      </div>
    </DamageComputeProvider>
  );
};