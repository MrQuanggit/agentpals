import { createContext, useContext } from 'react';
import type { CharacterMap } from '@agentpals/core';

/** The user's character customizations, shared with every view that draws an agent. */
export const CharactersContext = createContext<CharacterMap>({});
export const useCharacters = () => useContext(CharactersContext);
