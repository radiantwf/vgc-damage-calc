import React from 'react';
import './DisplayPokemon.css';
import { PokemonImage } from './01-PokemonImage/PokemonImage';
import { PokemonStats } from './02-PokemonStats/PokemonStats';
import { PokemonMoves } from './03-PokemonMoves/PokemonMoves';

interface DisplayPokemonProps {
  isAttacker: boolean;
  className?: string;
}

export const DisplayPokemon: React.FC<DisplayPokemonProps> = ({ 
  isAttacker, 
  className 
}) => {
  const tabBase = isAttacker ? 210000 : 220000;
  return (
    <div className={`display-pokemon ${isAttacker ? 'display-pokemon--attacker' : 'display-pokemon--defender'} ${className || ''}`}>
      <div className="display-pokemon__container">
        <PokemonImage isAttacker={isAttacker} tabIndexStart={tabBase} />
        <PokemonStats isAttacker={isAttacker} tabIndexStart={tabBase + 1000} />
        <PokemonMoves isAttacker={isAttacker} tabIndexStart={tabBase + 2000} />
      </div>
    </div>
  );
};