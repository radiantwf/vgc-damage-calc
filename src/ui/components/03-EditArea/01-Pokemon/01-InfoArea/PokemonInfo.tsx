import "./PokemonInfo.css";
import EditAreaProps from "../../Props/EditAreaProps.tsx";
import PokemonInfoColumn1 from "./01-ColumnArea1/PokemonInfoColumn1.tsx";
import PokemonInfoColumn2 from "./02-ColumnArea2/PokemonInfoColumn2.tsx";
import PokemonInfoColumn3 from "./03-ColumnArea3/PokemonInfoColumn3.tsx";
import PokemonInfoColumn4 from "./04-ColumnArea4/PokemonInfoColumn4.tsx";

const PokemonInfoArea: React.FC<EditAreaProps> = ({ isAttacker }) => {
  return (
    <div className="pi-pokemon-info-area">
      <PokemonInfoColumn1 isAttacker={isAttacker} />
      <PokemonInfoColumn2 isAttacker={isAttacker} />
      <PokemonInfoColumn3 isAttacker={isAttacker} />
      <PokemonInfoColumn4 isAttacker={isAttacker} />
    </div>
  );
};

export default PokemonInfoArea;
