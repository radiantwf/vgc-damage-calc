import PokemonInfoArea from "./01-InfoArea/PokemonInfo";
import PokemonStatsArea from "./02-StatsArea/PokemonStats";
import EditAreaProps from "../Props/EditAreaProps";
import "./Pokemon.css";

const Pokemon: React.FC<EditAreaProps> = ({ isAttacker }) => {
  return (
    <div className={`p-pokemon-area p-pokemon-${isAttacker ? 'attacker' : 'defender'}`}>
      <PokemonInfoArea isAttacker={isAttacker} />
      <PokemonStatsArea isAttacker={isAttacker} />
    </div>
  );
};

export default Pokemon;
