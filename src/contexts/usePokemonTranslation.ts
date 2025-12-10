import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { translationService } from "../services/translation.service";

interface PokemonTranslations {
  [key: string]: string;
}

interface ItemTranslations {
  [key: string]: string;
}

interface AbilityTranslations {
  [key: string]: string;
}

interface MoveTranslations {
  [key: string]: string;
}

interface NatureTranslations {
  [key: string]: string;
}

interface TypeTranslations {
  [key: string]: string;
}

export const usePokemonTranslation = () => {
  const { language } = useLanguage();
  const [pokemonTranslations, setPokemonTranslations] =
    useState<PokemonTranslations>({});
  const [itemTranslations, setItemTranslations] = useState<ItemTranslations>(
    {}
  );
  const [abilityTranslations, setAbilityTranslations] =
    useState<AbilityTranslations>({});
  const [moveTranslations, setMoveTranslations] = useState<MoveTranslations>(
    {}
  );
  const [natureTranslations, setNatureTranslations] =
    useState<NatureTranslations>({});
  const [typeTranslations, setTypeTranslations] = useState<TypeTranslations>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      setLoading(true);
      try {
        const translations = await translationService.getTranslations(language);

        setPokemonTranslations(translations.pokemon || {});
        setItemTranslations(translations.item || {});
        setAbilityTranslations(translations.ability || {});
        setMoveTranslations(translations.move || {});
        setNatureTranslations(translations.nature || {});
        setTypeTranslations(translations.type || {});
      } catch (error) {
        console.error("Failed to load translations:", error);
        setPokemonTranslations({});
        setItemTranslations({});
        setAbilityTranslations({});
        setMoveTranslations({});
        setNatureTranslations({});
        setTypeTranslations({});
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  const translatePokemon = useCallback(
    (pokemonName: string): string => {
      if (!pokemonName) return pokemonName;
      const key = pokemonName.toLowerCase().replace(/[^a-z0-9♀♂-]/g, "");
      return pokemonTranslations[key] || pokemonName;
    },
    [pokemonTranslations]
  );

  const translateItem = useCallback(
    (itemName: string): string => {
      if (!itemName) return itemName;
      const key = itemName.toLowerCase().replace(/[^a-z0-9]/g, "");
      return itemTranslations[key] || itemName;
    },
    [itemTranslations]
  );

  const translateAbility = useCallback(
    (abilityName: string): string => {
      if (!abilityName) return abilityName;
      const key = abilityName.toLowerCase().replace(/[^a-z0-9]/g, "");
      return abilityTranslations[key] || abilityName;
    },
    [abilityTranslations]
  );

  const translateMove = useCallback(
    (moveName: string): string => {
      if (!moveName) return moveName;
      const key = moveName.toLowerCase().replace(/[^a-z0-9]/g, "");
      return moveTranslations[key] || moveName;
    },
    [moveTranslations]
  );

  const translateNature = useCallback(
    (natureName: string): string => {
      if (!natureName) return natureName;
      const key = natureName.toLowerCase().replace(/[^a-z0-9]/g, "");
      return natureTranslations[key] || natureName;
    },
    [natureTranslations]
  );

  const translateType = useCallback(
    (typeName: string): string => {
      if (!typeName) return typeName;
      const key = typeName.toLowerCase().replace(/[^a-z0-9]/g, "");
      return typeTranslations[key] || typeName;
    },
    [typeTranslations]
  );

  const translateTypeShort = useCallback(
    (typeName: string): string => {
      if (!typeName) return typeName;
      const key = `short${typeName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      return typeTranslations[key] || typeName;
    },
    [typeTranslations]
  );

  return {
    translatePokemon,
    translateItem,
    translateAbility,
    translateMove,
    translateNature,
    translateType,
    translateTypeShort,
    loading,
  };
};
