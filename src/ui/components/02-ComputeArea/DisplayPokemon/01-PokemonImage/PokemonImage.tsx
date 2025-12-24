import React, { useMemo } from "react";
import "./PokemonImage.css";
import { usePokemonState } from "../../../../../contexts/PokemonStateContext";
import { ShowdownDataService } from "../../../../../services/showdown.data.service";
import {
  getTypeColor,
  getTypeTextColor,
} from "../../../../../utils/type.colors";
import { usePokemonTranslation } from "../../../../../contexts/usePokemonTranslation";

interface PokemonImageProps {
  isAttacker: boolean;
  className?: string;
  tabIndexStart?: number;
}

export const PokemonImage: React.FC<PokemonImageProps> = ({
  isAttacker,
  className,
  tabIndexStart,
}) => {
  const { pokemonSpecies, item } = usePokemonState(isAttacker);

  const pokemonImageUrl = useMemo(() => {
    return ShowdownDataService.getPokemonImgUrl(
      pokemonSpecies?.value?.name || undefined
    );
  }, [pokemonSpecies]);

  const itemImageUrl = useMemo(() => {
    return ShowdownDataService.getItemImgUrl(item?.name || undefined);
  }, [item]);

  const types = useMemo(() => {
    return pokemonSpecies?.value?.types?.map((t) => t.toLowerCase()) || [];
  }, [pokemonSpecies]);

  return (
    <div className={`pokemon-image ${className || ""}`}>
      <div className="pokemon-image__sprite-container">
        {pokemonImageUrl && (
          <img
            src={pokemonImageUrl}
            alt=""
            className="pokemon-image__sprite"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        {itemImageUrl && (
          <img
            src={itemImageUrl}
            alt=""
            className="pokemon-image__item"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>
      <div className="pokemon-image__types">
        {types.length === 2 ? (
          <div className="pokemon-image__dual-types">
            <div
              className={`pokemon-image__type`}
              style={{
                backgroundColor: getTypeColor(types[0]),
                color: getTypeTextColor(types[0]),
              }}
            />
            <div
              className={`pokemon-image__type`}
              style={{
                backgroundColor: getTypeColor(types[1]),
                color: getTypeTextColor(types[1]),
              }}
            />
          </div>
        ) : types.length === 1 ? (
          <div
            className={`pokemon-image__type pokemon-image__type--single`}
            style={{
              backgroundColor: getTypeColor(types[0]),
              color: getTypeTextColor(types[0]),
            }}
          />
        ) : (
          <div
            className="pokemon-image__type pokemon-image__type--single"
            style={{ backgroundColor: "transparent", border: "none" }}
          />
        )}
      </div>
    </div>
  );
};
