import "./PokemonStats.css";
import EditAreaProps from "../../Props/EditAreaProps.tsx";
import PokemonStatsTable from "./01-StatsTable/PokemonStatsTable.tsx";
import PokemonMetaBuilds from "./02-MetaBuilds/PokemonMetaBuilds.tsx";

const PokemonStatsArea: React.FC<EditAreaProps> = ({ isAttacker }) => {
  return <div className="ps-pokemon-stats-area">
    <PokemonStatsTable isAttacker={isAttacker} />
    <PokemonMetaBuilds isAttacker={isAttacker} />
  </div>;
};

export default PokemonStatsArea;
