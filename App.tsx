
import React, { useState, useCallback, useMemo, ChangeEvent, useEffect } from 'react';
import type { Character, Stat, Attribute, Skill, Weapon, Archetype, ImageSet, InventoryItem, MaskForm, Ritual, MasterItemTemplate, MasterRitualTemplate, RollResult, DiceType, RollOutcome } from './types';
import { LogoIcon, D20Icon, ritualSignComponents, RitualSignSelector } from './components/Icons';
import { DiceRoller } from './components/DiceRoller';
import { Inventory } from './components/Inventory';

// --- DATA STORAGE ---
const DB_KEY = 'cyberghost_operative_db';
const MASTER_ITEMS_KEY = 'cyberghost_master_items';
const MASTER_RITUALS_KEY = 'cyberghost_master_rituals';


const initialCharacterTemplate: Omit<Character, 'id' | 'attributePoints' | 'skillPoints'> = {
  personalDetails: {
    name: 'Novo Operativo', player: 'Jogador', occupation: 'Ocupação', age: 'Idade',
    gender: 'Gênero', birthplace: 'Local de Nascimento', residence: 'Localização Atual',
  },
  imageSet: {
    base: null,
    variants: [],
    wounded: null,
    critical: null,
  },
  appearanceNotes: "Descreva a aparência e o equipamento do operativo...",
  archetype: 'Nenhum',
  stats: {
    life: { current: 20, max: 20 },
    sanity: { current: 80, max: 80 },
    occultism: { current: 5, max: 100 },
  },
  attributes: [
    { name: 'Força', value: 10 }, { name: 'Destreza', value: 10 },
    { name: 'Constituição', value: 10 }, { name: 'Aparência', value: 10 },
    { name: 'Educação', value: 10 }, { name: 'Inteligência', value: 10 },
    { name: 'Poder', value: 10 }, { name: 'Sorte', value: 10 },
  ],
  movement: 7,
  size: 10,
  skills: [
    { id: '1', name: 'Atletismo', value: 10, isFavorite: false },
    { id: '2', name: 'Atualidades', value: 10, isFavorite: false },
    { id: '3', name: 'Ciência', value: 10, isFavorite: false },
    { id: '4', name: 'Diplomacia', value: 10, isFavorite: false },
    { id: '5', name: 'Enganação', value: 10, isFavorite: false },
    { id: '6', name: 'Fortitude', value: 10, isFavorite: true },
    { id: '7', name: 'Furtividade', value: 10, isFavorite: true },
    { id: '8', name: 'Intimidação', value: 10, isFavorite: false },
    { id: '9', name: 'Investigação', value: 10, isFavorite: true },
    { id: '10', name: 'Luta', value: 10, isFavorite: false },
    { id: '11', name: 'Medicina', value: 10, isFavorite: false },
    { id: '12', name: 'Ocultismo', value: 10, isFavorite: true },
    { id: '13', name: 'Percepção', value: 25, isFavorite: true },
    { id: '14', name: 'Pilotagem', value: 10, isFavorite: false },
    { id: '15', name: 'Pontaria', value: 10, isFavorite: false },
    { id: '16', name: 'Prestidigitação', value: 10, isFavorite: false },
    { id: '17', name: 'Profissão', value: 10, isFavorite: false },
    { id: '18', name: 'Reflexos', value: 10, isFavorite: false },
    { id: '19', name: 'Religião', value: 10, isFavorite: false },
    { id: '20', name: 'Tática', value: 10, isFavorite: false },
    { id: '21', name: 'Tecnologia', value: 10, isFavorite: false },
    { id: '22', name: 'Vontade', value: 10, isFavorite: true },
  ],
  combat: [
    {
      id: 'unarmed_soco', name: 'Soco', type: 'Contusão', damage: '1d3', currentAmmo: 0, maxAmmo: 0,
      attacks: '1', range: 'Toque', malfunction: '-', area: '-', isUnarmed: true,
    },
  ],
  rituals: [],
  inventory: [
      { id: 'item_pistola', name: 'Pistola a Laser', width: 3, height: 1, x: 0, y: 0, weight: 1.5, description: 'Arma de energia compacta.', rotated: false },
      { id: 'item_katana', name: 'Katana Monomolecular', width: 1, height: 4, x: 0, y: 1, weight: 1.2, description: 'Lâmina de alta frequência.', rotated: false },
      { id: 'item_faca', name: 'Faca', width: 1, height: 2, x: 1, y: 5, weight: 0.5, description: 'Lâmina de combate padrão.', rotated: false },
  ],
  maskForm: null,
};

const defaultMasterItemTemplates: MasterItemTemplate[] = [
    { name: 'Pistola a Laser', width: 3, height: 1, weight: 1.5, description: 'Arma de energia compacta.', weapon: { type: 'Energia', damage: '1d10', currentAmmo: 20, maxAmmo: 20, attacks: '1', range: 'Médio', malfunction: '98', area: '-' } },
    { name: 'Katana Monomolecular', width: 1, height: 4, weight: 1.2, description: 'Lâmina de alta frequência.', weapon: { type: 'Corte Leve', damage: '1d8+1', currentAmmo: 0, maxAmmo: 0, attacks: '1', range: 'Toque', malfunction: '-', area: '-' } },
    { name: 'Faca', width: 1, height: 2, weight: 0.5, description: 'Lâmina de combate padrão.', weapon: { type: 'Corte Leve', damage: '1d4', currentAmmo: 0, maxAmmo: 0, attacks: '1', range: 'Toque', malfunction: '-', area: '-' } },
    { name: 'Escopeta Inteligente', width: 4, height: 2, weight: 4.0, description: 'Dispara projéteis que rastreiam alvos próximos.', weapon: { type: 'Dispersão', damage: '2d8', currentAmmo: 8, maxAmmo: 8, attacks: '1', range: 'Curto', malfunction: '96', area: 'Cone' } },
    { name: 'Submetralhadora Compacta', width: 3, height: 2, weight: 2.5, description: 'Arma automática de alta cadência.', weapon: { type: 'Balística', damage: '1d8', currentAmmo: 30, maxAmmo: 30, attacks: '3/Rajada', range: 'Médio', malfunction: '97', area: '-' } },
    { name: 'Kit Médico', width: 2, height: 2, weight: 1.0, description: 'Kit de primeiros socorros. Cura 1d10 de vida.' },
    { name: 'Munição (Pistola)', width: 1, height: 1, weight: 0.3, description: 'Pente de munição para pistolas a laser.'},
    { name: 'Mochila', width: 6, height: 10, weight: 3, description: 'Reduz o peso dos itens guardados nela em 50%.'},
    { name: 'Mascara Misteriosa', width: 3, height: 3, weight: 1, description: 'Um artefato de poder desconhecido e perigoso.' },
    { name: 'Baralho de Tarot', width: 2, height: 2, weight: 0.2, description: 'Canaliza poder arcano, concedendo ataques e habilidades.' },
];

const defaultMasterRitualTemplates: MasterRitualTemplate[] = [
    { id: 'default_1', name: 'Fragmentado', description: 'Cria uma ilusão estilhaçada de uma área ou objeto, confundindo todos que a observam com imagens quebradas e distorcidas.', cost: '15 PE', execution: '1 Ação', range: 'Médio', duration: 'Concentração', invocationSign: 'fragmentado' },
    { id: 'default_2', name: 'Caos', description: 'Libera uma onda de energia entrópica que embaralha os sentidos e pode causar efeitos aleatórios em alvos próximos.', cost: '20 PE', execution: '1 Ação', range: 'Curto', duration: '1d4 turnos', invocationSign: 'caos' },
    { id: 'default_3', name: 'Al KAI', description: 'Conhecido como "O Primeiro Paranormal", este ritual ancestral canaliza energia pura, podendo fortalecer aliados ou enfraquecer barreiras dimensionais.', cost: 'Variável', execution: '1 Rodada', range: 'Longo', duration: 'Variável', invocationSign: 'alkai' },
    { id: 'default_4', name: 'Selo da Morte', description: 'Marca um alvo com um presságio de morte, tornando-o vulnerável a danos e dificultando qualquer forma de cura.', cost: '25 PE', execution: '1 Ação', range: 'Longo', duration: 'Cena', invocationSign: 'morte' },
    { id: 'default_5', name: 'Pacto de Sangue', description: 'Um ritual perigoso que usa a própria força vital para alimentar um poder, oferecendo grandes recompensas em troca de um sacrifício.', cost: 'Vida', execution: '1 Minuto', range: 'Pessoal', duration: 'Permanente', invocationSign: 'sangue' },
];

const maskFormsData: Record<MaskForm, { name: string; description: string; passive: string; weapon?: Omit<Weapon, 'id'>; rituals?: Omit<Ritual, 'id'>[] }> = {
    'Oni': {
        name: 'Forma de Oni',
        description: 'A máscara se contorce em uma face demoníaca com presas. Seus músculos se enrijecem e sua pele adquire um tom avermelhado.',
        passive: `Berserker: Quanto mais ódio (dano recebido), mais resistente você se torna.`,
        weapon: { name: 'Kanabo Demoníaco', type: 'Pesada', damage: '2d8+Força', attacks: '1', range: 'Corpo a corpo', currentAmmo: 0, maxAmmo: 0, malfunction: '-', area: 'Esmagamento', isMaskWeapon: true },
    },
    'Besta': {
        name: 'Forma de Besta',
        description: 'Seus traços se tornam animalescos, garras afiadas brotam de seus dedos e um rosnado gutural escapa de seus lábios.',
        passive: `Fúria: Quanto mais tempo em combate, mais dano você causa. Desvantagem: Pode atacar aliados se não houver inimigos.`,
        weapon: { name: 'Garras Ferais', type: 'Leve', damage: '1d10+Destreza', attacks: '2', range: 'Toque', currentAmmo: 0, maxAmmo: 0, malfunction: '-', area: 'Corte', isMaskWeapon: true },
    },
    'Ninja': {
        name: 'Forma de Ninja',
        description: 'A máscara se torna lisa e sem traços, e seu corpo é envolto em sombras que se movem com você.',
        passive: `Sombra Mortal: Ataques surpresa causam dano massivo. Ganha acesso a Ninjutsus.`,
        weapon: { name: 'Katana Sombria', type: 'Média', damage: '2d6', attacks: '1', range: 'Corpo a corpo', currentAmmo: 0, maxAmmo: 0, malfunction: '-', area: 'Corte preciso', isMaskWeapon: true },
        rituals: [
            { name: 'Ninjutsu: Invisibilidade', cost: '1 Ação', execution: 'Concentração', range: 'Pessoal', duration: 'Até atacar', description: 'Fica invisível, o próximo ataque surpresa tem dano bufado. Após atacar, gasta uma ação para se concentrar e ficar invisível novamente.', isMaskRitual: true }
        ]
    },
    'Cultista': {
        name: 'Forma de Cultista',
        description: 'Símbolos arcanos brilham em sua pele e a máscara ganha um terceiro olho que pulsa com uma luz sinistra. Você sussurra em uma língua morta.',
        passive: `Harmonia Paranormal: Através do Grimório da Loucura manifestado pela máscara, seus rituais são mais potentes e você ganha acesso a novos poderes.`,
        rituals: [
            { name: 'Breo', cost: '1 Ação', execution: 'Instantânea', range: 'Médio', duration: '1d4 turnos', description: 'Deixa a pessoa cega.', isMaskRitual: true },
            { name: 'Telecinese', cost: '1 Ação', execution: 'Concentração', range: 'Longo', duration: 'Mantido', description: 'Poderes psíquicos para mover objetos.', isMaskRitual: true },
            { name: 'Teleporte', cost: '1 Ação', execution: 'Instantânea', range: 'Pessoal/Toque', duration: 'Instantânea', description: 'Teleporta para um local conhecido.', isMaskRitual: true },
        ]
    },
    'Franco Atirador': {
        name: 'Forma de Franco Atirador',
        description: 'Seus olhos brilham com uma precisão sobrenatural e sua postura se torna perfeitamente estável, como uma estátua.',
        passive: `Olho Distante: Dano aumenta drasticamente com a distância e se o alvo não souber sua localização.`,
        weapon: { name: 'Rifle do Outro Lado', type: 'À Distância', damage: '3d10', attacks: '1', range: 'Extremo', currentAmmo: 1, maxAmmo: 1, malfunction: '1', area: 'Perfuração', isMaskWeapon: true },
        rituals: [
            { name: 'Poder: Manipulação de Patente', cost: 'Especial', execution: 'Instantânea', range: 'Pessoal', duration: 'Mantido', description: 'Pode manipular sua patente (de recruta a coronel), mudando seu uniforme e equipamento (incluindo a arma).', isMaskRitual: true },
            { name: 'Poder: Taps', cost: '1 Minuto', execution: 'Canalização', range: 'Auditivo (Time)', duration: 'Combate', description: 'Toca uma corneta. Remove todos os debuffs e efeitos físicos do time. O time não sente dor. Aliados caídos se levantam.', isMaskRitual: true },
        ]
    },
    'Duelista': {
        name: 'Forma de Duelista',
        description: 'Seu corpo se move com uma graça impossível e seus reflexos são afiados a um nível sobrenatural.',
        passive: `Estilo de Duelo: Ganha acesso a um repertório de habilidades de esgrima superiores.`,
        weapon: { name: 'Rapieira Espectral', type: 'Ágil', damage: '1d12', attacks: '1', range: 'Corpo a corpo', currentAmmo: 0, maxAmmo: 0, malfunction: '-', area: 'Estocada', isMaskWeapon: true },
        rituals: [
            { name: 'Habilidade: Rajadas de Estocadas', cost: '1 Ação', execution: 'Instantânea', range: 'Corpo a corpo', duration: 'Instantânea', description: 'Realiza um Dx de estocadas, com Dx de dano em cada acerto, rodando cada dado.', isMaskRitual: true },
            { name: 'Habilidade: Esquivas e Contra-Ataques', cost: 'Reação', execution: 'Especial', range: 'Pessoal', duration: 'Instantânea', description: 'Vantagens em desviar. Se conseguir, roda um dado para atacar novamente com vantagem no dano. Pode desarmar ou desequilibrar.', isMaskRitual: true },
            { name: 'Habilidade: Determinação de Mosqueteiro', cost: '1 Ação (Canalizar)', execution: 'Concentração', range: 'Pessoal', duration: 'Combate', description: 'A Rapieira brilha. Permite atacar 2 vezes por turno com mais velocidade e agilidade.', isMaskRitual: true },
            { name: 'Habilidade: Redirecionar Ataque', cost: 'Reação', execution: 'Especial', range: 'Pessoal', duration: 'Instantânea', description: 'Pode anular e redirecionar ataques físicos. Contra magias, tenta cortar/desviar; se falhar, toma metade do dano.', isMaskRitual: true },
        ]
    }
};

const tarotCardWeaponsData: Omit<Weapon, 'id' | 'isTarotCard'>[] = [
    { name: 'Hierofante', type: 'Arcana', damage: '1d6', currentAmmo: 0, maxAmmo: 0, attacks: '1', range: 'Médio', malfunction: '-', area: 'Projétil Místico' },
    { name: 'O Diabo', type: 'Arcana', damage: '1d8/turno', currentAmmo: 0, maxAmmo: 0, attacks: '1', range: 'Médio', malfunction: '-', area: 'Dano Contínuo (3 turnos)' },
];

const tarotCardRitualsData: Omit<Ritual, 'id' | 'isTarotRitual'>[] = [
    { name: 'O Enforcado', cost: '1 Ação', execution: 'Instantânea', range: 'Médio', duration: 'd3 turnos', description: 'Aprisiona um alvo.' },
    { name: 'A Sacerdotisa', cost: '1 Ação', execution: 'Instantânea', range: 'Toque', duration: 'Instantânea', description: 'Cura 1d8 de vida.' },
    { name: 'O Sol', cost: '1 Ação', execution: 'Instantânea', range: 'Curto', duration: '1 turno', description: 'Cria um clarão de luz que pode cegar.' },
];

const getCharacters = (): Character[] => {
  try {
    const data = localStorage.getItem(DB_KEY);
    const characters: Character[] = data ? JSON.parse(data) : [];
    return characters.map(char => {
        if (char.attributePoints === undefined) char.attributePoints = 0;
        if (char.skillPoints === undefined) char.skillPoints = 0;
        if (char.maskForm === undefined) char.maskForm = null;
        if (char.rituals === undefined) char.rituals = [];
        char.combat = char.combat.map(w => ({ ...w, isMaskWeapon: !!w.isMaskWeapon, isTarotCard: !!w.isTarotCard, isUnarmed: !!w.isUnarmed, linkedItemId: w.linkedItemId }));
        char.rituals = char.rituals.map(r => ({ ...r, isMaskRitual: !!r.isMaskRitual, isTarotRitual: !!r.isTarotRitual }));
        return char;
    });
  } catch (error) {
    console.error("Falha ao ler personagens do localStorage", error);
    return [];
  }
};

const saveCharacters = (characters: Character[]): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(characters));
  } catch (error) {
    console.error("Falha ao salvar personagens no localStorage", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('ERRO: Não foi possível salvar. O armazenamento do navegador está cheio, provavelmente devido a imagens grandes. Tente remover algumas imagens de personagem.');
    }
  }
};

const getCharacter = (id: string): Character | undefined => {
  return getCharacters().find(c => c.id === id);
};

const createCharacter = (): Character => {
  const characters = getCharacters();
  const newCharacter: Character = {
    ...JSON.parse(JSON.stringify(initialCharacterTemplate)),
    id: Date.now().toString(),
    personalDetails: {
      ...initialCharacterTemplate.personalDetails,
      name: `Operativo #${(characters.length + 1).toString().padStart(3, '0')}`,
    },
    attributePoints: 20,
    skillPoints: 250,
  };
  characters.push(newCharacter);
  saveCharacters(characters);
  return newCharacter;
};

const updateCharacter = (id: string, updatedCharacterData: Omit<Character, 'id'>): void => {
  const characters = getCharacters();
  const index = characters.findIndex(c => c.id === id);
  if (index !== -1) {
    characters[index] = { ...updatedCharacterData, id };
    saveCharacters(characters);
  }
};

const deleteCharacter = (id: string): void => {
  let characters = getCharacters();
  characters = characters.filter(c => c.id !== id);
  saveCharacters(characters);
};

const getMasterItemTemplates = (): MasterItemTemplate[] => {
    try {
        const data = localStorage.getItem(MASTER_ITEMS_KEY);
        return data ? JSON.parse(data) : defaultMasterItemTemplates;
    } catch (error) {
        console.error("Falha ao ler os itens de mestre do localStorage", error);
        return defaultMasterItemTemplates;
    }
};

const saveMasterItemTemplates = (templates: MasterItemTemplate[]): void => {
    try {
        localStorage.setItem(MASTER_ITEMS_KEY, JSON.stringify(templates));
    } catch (error) {
        console.error("Falha ao salvar os itens de mestre no localStorage", error);
    }
};

const getMasterRitualTemplates = (): MasterRitualTemplate[] => {
    try {
        const data = localStorage.getItem(MASTER_RITUALS_KEY);
        return data ? JSON.parse(data) : defaultMasterRitualTemplates;
    } catch (error) {
        console.error("Falha ao ler os rituais de mestre do localStorage", error);
        return defaultMasterRitualTemplates;
    }
};

const saveMasterRitualTemplates = (templates: MasterRitualTemplate[]): void => {
    try {
        localStorage.setItem(MASTER_RITUALS_KEY, JSON.stringify(templates));
    } catch (error) {
        console.error("Falha ao salvar os rituais de mestre no localStorage", error);
    }
};

// --- IMAGE HELPERS ---
const getCurrentImage = (character: Character): { url: string | null; isDying: boolean } => {
  if (!character) return { url: null, isDying: false };
  const { imageSet, stats } = character;
  const lifePercent = stats.life.max > 0 ? (stats.life.current / stats.life.max) : 1;
  
  let url = imageSet.base;
  if (lifePercent <= 0.25 && imageSet.critical) {
    url = imageSet.critical;
  } else if (lifePercent <= 0.50 && imageSet.wounded) {
    url = imageSet.wounded;
  }

  const isDying = lifePercent <= 0.15;
  
  return { url, isDying };
};


// --- PAGE COMPONENTS ---

const LoginPage: React.FC<{ onLoginSuccess: () => void; }> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'Felks' && password === 'exterminador1') {
            setError('');
            sessionStorage.setItem('isMasterLoggedIn', 'true');
            onLoginSuccess();
        } else {
            setError('CREDENCIAS INVÁLIDAS. ACESSO NEGADO.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="p-8 border border-gray-700/50 bg-black/70 backdrop-blur-sm w-full max-w-sm shadow-lg shadow-gray-900/50">
                <h1 className="text-3xl text-center uppercase tracking-[0.2em] mb-6 text-gray-100">ACESSO MESTRE</h1>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="USUÁRIO"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-black/50 border border-gray-600 px-3 py-2 text-lg focus:outline-none focus:border-gray-300 focus:bg-black/70 text-gray-200 placeholder:text-gray-500"
                        aria-label="Login"
                    />
                    <input
                        type="password"
                        placeholder="SENHA"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-black/50 border border-gray-600 px-3 py-2 text-lg focus:outline-none focus:border-gray-300 focus:bg-black/70 text-gray-200 placeholder:text-gray-500"
                        aria-label="Senha"
                    />
                    <button type="submit" className="border border-gray-600 hover:bg-gray-800 p-3 text-lg transition-all uppercase text-gray-200 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                        Autorizar
                    </button>
                    {error && <p className="text-red-400 text-center mt-2 animate-pulse">{error}</p>}
                </form>
            </div>
        </div>
    );
};

const MiniStatBar: React.FC<{ current: number, max: number, color: string }> = ({ current, max, color }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-black/50 h-2 border border-black/80 overflow-hidden">
            <div className={`${color} h-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const GrantPointsModal: React.FC<{
    character: Character;
    onClose: () => void;
    onSave: (charId: string, attrPoints: number, skillPoints: number) => void;
}> = ({ character, onClose, onSave }) => {
    const [attrPoints, setAttrPoints] = useState(0);
    const [skillPoints, setSkillPoints] = useState(0);

    const handleSave = () => {
        onSave(character.id, attrPoints, skillPoints);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-black border border-gray-700 w-full max-w-md p-6 shadow-2xl shadow-black">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl uppercase tracking-widest">Conceder Pontos</h2>
                    <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white">&times;</button>
                </div>
                <p className="mb-6 text-gray-400">Adicione pontos para <span className="text-white font-bold">{character.personalDetails.name}</span>.</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-300 mb-1">Pontos de Atributo</label>
                        <input
                            type="number"
                            value={attrPoints}
                            onChange={(e) => setAttrPoints(parseInt(e.target.value) || 0)}
                            className="w-full bg-black/50 border border-gray-600 px-3 py-2 text-lg focus:outline-none focus:border-gray-300 text-gray-200"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-1">Pontos de Perícia</label>
                        <input
                            type="number"
                            value={skillPoints}
                            onChange={(e) => setSkillPoints(parseInt(e.target.value) || 0)}
                             className="w-full bg-black/50 border border-gray-600 px-3 py-2 text-lg focus:outline-none focus:border-gray-300 text-gray-200"
                        />
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
                    <button onClick={handleSave} className="border border-gray-600 hover:bg-gray-800 p-3 text-lg transition-all uppercase text-gray-200 px-8">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const CreateItemModal: React.FC<{
    onClose: () => void;
    onSave: (newItem: MasterItemTemplate) => void;
}> = ({ onClose, onSave }) => {
    const [item, setItem] = useState<Omit<MasterItemTemplate, 'weapon'> & { isWeapon: boolean; weapon?: MasterItemTemplate['weapon'] }>({
        name: '', width: 1, height: 1, weight: 0.1, description: '', isWeapon: false,
    });

    const handleItemChange = (field: keyof Omit<MasterItemTemplate, 'weapon'>, value: string | number) => {
        setItem(prev => ({ ...prev, [field]: value }));
    };

    const handleWeaponChange = (field: keyof NonNullable<MasterItemTemplate['weapon']>, value: string | number) => {
        setItem(prev => ({
            ...prev,
            weapon: { ...prev.weapon, [field]: value }
        }));
    };

    const handleToggleWeapon = () => {
        setItem(prev => ({
            ...prev,
            isWeapon: !prev.isWeapon,
            weapon: !prev.isWeapon
                ? { type: 'Balística', damage: '1d6', currentAmmo: 10, maxAmmo: 10, attacks: '1', range: 'Médio', malfunction: '96', area: '-' }
                : undefined
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { isWeapon, ...itemToSave } = item;
        onSave(itemToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-black border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl shadow-black">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl uppercase tracking-widest">Criar Novo Item</h2>
                    <button type="button" onClick={onClose} className="text-2xl text-gray-500 hover:text-white">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4">
                    {/* Item Fields */}
                    <input type="text" placeholder="Nome do Item" value={item.name} onChange={e => handleItemChange('name', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" required />
                    <textarea placeholder="Descrição" value={item.description} onChange={e => handleItemChange('description', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200 h-20 resize-none" />
                    <div className="grid grid-cols-3 gap-4">
                        <input type="number" placeholder="Peso" value={item.weight} onChange={e => handleItemChange('weight', parseFloat(e.target.value))} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" step="0.1" min="0" />
                        <input type="number" placeholder="Largura" value={item.width} onChange={e => handleItemChange('width', parseInt(e.target.value))} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" min="1" />
                        <input type="number" placeholder="Altura" value={item.height} onChange={e => handleItemChange('height', parseInt(e.target.value))} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" min="1" />
                    </div>

                    {/* Weapon Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={item.isWeapon} onChange={handleToggleWeapon} className="w-5 h-5 bg-gray-700 border-gray-500 text-cyan-400 focus:ring-cyan-500" />
                        <span className="text-gray-200">É uma arma?</span>
                    </label>

                    {/* Weapon Fields */}
                    {item.isWeapon && item.weapon && (
                        <div className="border border-gray-800 p-4 space-y-4 animate-fade-in">
                             <div className="grid grid-cols-2 gap-4">
                                 <input type="text" placeholder="Tipo (Ex: Corte, Balística)" value={item.weapon.type} onChange={e => handleWeaponChange('type', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                                 <input type="text" placeholder="Dano (Ex: 1d8)" value={item.weapon.damage} onChange={e => handleWeaponChange('damage', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <input type="number" placeholder="Mun. Atual" value={item.weapon.currentAmmo} onChange={e => handleWeaponChange('currentAmmo', parseInt(e.target.value))} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                                <input type="number" placeholder="Mun. Máxima" value={item.weapon.maxAmmo} onChange={e => handleWeaponChange('maxAmmo', parseInt(e.target.value))} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                                <input type="text" placeholder="Ataques" value={item.weapon.attacks} onChange={e => handleWeaponChange('attacks', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                                <input type="text" placeholder="Defeito" value={item.weapon.malfunction} onChange={e => handleWeaponChange('malfunction', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Alcance" value={item.weapon.range} onChange={e => handleWeaponChange('range', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                                <input type="text" placeholder="Área" value={item.weapon.area} onChange={e => handleWeaponChange('area', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700 text-right flex-shrink-0">
                    <button type="submit" className="border border-gray-600 hover:bg-gray-800 p-3 text-lg transition-all uppercase text-gray-200 px-8">Salvar Item</button>
                </div>
            </form>
        </div>
    );
};

const RitualDetailsModal: React.FC<{ ritual: MasterRitualTemplate; onClose: () => void; }> = ({ ritual, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-black border border-yellow-400/20 w-full max-w-lg p-6 shadow-2xl shadow-yellow-400/10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-3xl uppercase tracking-widest text-yellow-300">{ritual.name}</h2>
                        <p className="text-gray-400 italic">{ritual.description}</p>
                    </div>
                    <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white">&times;</button>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-40 h-40 flex-shrink-0 border border-yellow-400/30 p-2 text-yellow-400 bg-black">
                        <RitualSignSelector signKey={ritual.invocationSign} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-gray-300 flex-grow">
                        <div><strong className="text-gray-500 block uppercase text-xs">Custo:</strong> {ritual.cost}</div>
                        <div><strong className="text-gray-500 block uppercase text-xs">Execução:</strong> {ritual.execution}</div>
                        <div><strong className="text-gray-500 block uppercase text-xs">Alcance:</strong> {ritual.range}</div>
                        <div><strong className="text-gray-500 block uppercase text-xs">Duração:</strong> {ritual.duration}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RitualEditorModal: React.FC<{
    ritual?: MasterRitualTemplate;
    onClose: () => void;
    onSave: (ritual: MasterRitualTemplate) => void;
}> = ({ ritual, onClose, onSave }) => {
    const [editedRitual, setEditedRitual] = useState<MasterRitualTemplate>(
        ritual || { id: `master_${Date.now()}`, name: '', description: '', cost: '', execution: '', range: '', duration: '', invocationSign: 'fragmentado' }
    );

    const handleChange = (field: keyof Omit<MasterRitualTemplate, 'id'>, value: string) => {
        setEditedRitual(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedRitual);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-black border border-gray-700 w-full max-w-3xl max-h-[90vh] flex flex-col p-6 shadow-2xl shadow-black">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl uppercase tracking-widest">{ritual ? 'Editar Ritual' : 'Criar Novo Ritual'}</h2>
                    <button type="button" onClick={onClose} className="text-2xl text-gray-500 hover:text-white">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4">
                    <input type="text" placeholder="Nome do Ritual" value={editedRitual.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" required />
                    <textarea placeholder="Descrição" value={editedRitual.description} onChange={e => handleChange('description', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200 h-24 resize-none" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input type="text" placeholder="Custo" value={editedRitual.cost} onChange={e => handleChange('cost', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                        <input type="text" placeholder="Execução" value={editedRitual.execution} onChange={e => handleChange('execution', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                        <input type="text" placeholder="Alcance" value={editedRitual.range} onChange={e => handleChange('range', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                        <input type="text" placeholder="Duração" value={editedRitual.duration} onChange={e => handleChange('duration', e.target.value)} className="w-full bg-black/50 border border-gray-600 p-2 text-gray-200" />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2">Sinal de Invocação</label>
                        <div className="grid grid-cols-5 gap-2">
                            {Object.keys(ritualSignComponents).map(key => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleChange('invocationSign', key)}
                                    className={`w-full h-20 p-2 border-2 transition-colors ${editedRitual.invocationSign === key ? 'border-yellow-400 bg-yellow-900/30' : 'border-gray-700 bg-black/50 hover:border-gray-500'}`}
                                >
                                    <div className="text-yellow-400 w-full h-full">
                                      <RitualSignSelector signKey={key} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700 text-right flex-shrink-0">
                    <button type="submit" className="border border-gray-600 hover:bg-gray-800 p-3 text-lg transition-all uppercase text-gray-200 px-8">Salvar Ritual</button>
                </div>
            </form>
        </div>
    );
};

const DashboardPage: React.FC<{ onNavigate: (path: string) => void; onLogout: () => void; }> = ({ onNavigate, onLogout }) => {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [masterItems, setMasterItems] = useState<MasterItemTemplate[]>([]);
    const [masterRituals, setMasterRituals] = useState<MasterRitualTemplate[]>([]);
    
    const [copiedInfo, setCopiedInfo] = useState<{ id: string, type: 'sheet' | 'portrait' } | null>(null);
    const [grantingPointsFor, setGrantingPointsFor] = useState<Character | null>(null);
    const [creatingItem, setCreatingItem] = useState(false);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'items' | 'rituals'>('items');
    
    const [viewingRitual, setViewingRitual] = useState<MasterRitualTemplate | null>(null);
    const [editingRitual, setEditingRitual] = useState<MasterRitualTemplate | undefined>(undefined);


    useEffect(() => {
        setCharacters(getCharacters());
        setMasterItems(getMasterItemTemplates());
        setMasterRituals(getMasterRitualTemplates());
    }, []);

    const handleCreateCharacter = () => {
        const newChar = createCharacter();
        onNavigate(`#/character/${newChar.id}`);
    };

    const handleDeleteCharacter = (id: string, name: string) => {
        if (window.confirm(`Você tem certeza que deseja apagar o arquivo de "${name}"? Esta ação é irreversível.`)) {
            deleteCharacter(id);
            setCharacters(prevCharacters => prevCharacters.filter(char => char.id !== id));
        }
    };
    
    const handleCopyLink = (id: string, type: 'sheet' | 'portrait') => {
        const path = type === 'sheet' ? `#/character/${id}` : `#/portrait/${id}`;
        const url = `${window.location.origin}${window.location.pathname}${path}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedInfo({id, type});
            setTimeout(() => setCopiedInfo(null), 2000);
        }).catch(err => {
            console.error("Falha ao copiar o link: ", err);
            alert("Falha ao copiar o link.");
        });
    };
    
    const handleGrantPoints = (charId: string, attrPoints: number, skillPoints: number) => {
        const currentCharacters = getCharacters();
        const charIndex = currentCharacters.findIndex(c => c.id === charId);
        if (charIndex !== -1) {
            currentCharacters[charIndex].attributePoints += attrPoints;
            currentCharacters[charIndex].skillPoints += skillPoints;
            saveCharacters(currentCharacters);
            setCharacters(currentCharacters); // Refresh dashboard state
        }
    };

    const handleSaveNewMasterItem = (newItem: MasterItemTemplate) => {
        const updatedItems = [...masterItems, newItem];
        setMasterItems(updatedItems);
        saveMasterItemTemplates(updatedItems);
    };

    const handleSaveRitual = (ritualToSave: MasterRitualTemplate) => {
        const existingIndex = masterRituals.findIndex(r => r.id === ritualToSave.id);
        let updatedRituals;
        if (existingIndex > -1) {
            updatedRituals = masterRituals.map(r => r.id === ritualToSave.id ? ritualToSave : r);
        } else {
            updatedRituals = [...masterRituals, ritualToSave];
        }
        setMasterRituals(updatedRituals);
        saveMasterRitualTemplates(updatedRituals);
        setEditingRitual(undefined);
    };

    const handleDragStart = (e: React.DragEvent, itemTemplate: MasterItemTemplate) => {
        const invItem: Omit<InventoryItem, 'id' | 'x' | 'y' | 'rotated' | 'containerId'> = {
            name: itemTemplate.name,
            width: itemTemplate.width,
            height: itemTemplate.height,
            weight: itemTemplate.weight,
            description: itemTemplate.description,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(invItem));
    };

    const handleDrop = (e: React.DragEvent, characterId: string) => {
        e.preventDefault();
        setDropTargetId(null);

        try {
            const itemTemplate: Omit<InventoryItem, 'id' | 'x' | 'y' | 'rotated' | 'containerId'> = JSON.parse(e.dataTransfer.getData('application/json'));
            const allChars = getCharacters();
            const charIndex = allChars.findIndex(c => c.id === characterId);

            if (charIndex === -1) return;

            const targetCharacter = allChars[charIndex];
            const { inventory } = targetCharacter;

            const isGridOccupied = (x: number, y: number, width: number, height: number, items: InventoryItem[]): boolean => {
                for (const item of items) {
                    if (item.containerId) continue;
                    const itemWidth = item.rotated ? item.height : item.width;
                    const itemHeight = item.rotated ? item.width : item.height;
                    if (x < item.x + itemWidth && x + width > item.x && y < item.y + itemHeight && y + height > item.y) {
                        return true;
                    }
                }
                return false;
            };

            let foundSpot = false;
            for (let yPos = 0; yPos <= 10 - itemTemplate.height; yPos++) {
                for (let xPos = 0; xPos <= 10 - itemTemplate.width; xPos++) {
                    if (!isGridOccupied(xPos, yPos, itemTemplate.width, itemTemplate.height, inventory)) {
                        const newItem: InventoryItem = {
                            ...itemTemplate,
                            id: `master_${Date.now()}`,
                            x: xPos,
                            y: yPos,
                            rotated: false
                        };
                        targetCharacter.inventory.push(newItem);
                        foundSpot = true;
                        break;
                    }
                }
                if (foundSpot) break;
            }

            if (foundSpot) {
                allChars[charIndex] = targetCharacter;
                saveCharacters(allChars);
                setCharacters(allChars); // Refresh UI
            } else {
                alert(`Inventário de ${targetCharacter.personalDetails.name} está cheio.`);
            }

        } catch (error) {
            console.error("Falha ao soltar o item:", error);
        }
    };

    return (
        <div className="text-gray-200 min-h-screen p-4 md:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <LogoIcon />
                    <div>
                        <h1 className="text-4xl uppercase tracking-[0.2em]">PAINEL DE CONTROLE</h1>
                        <p className="text-sm text-gray-500">//ARSENAL.LOG</p>
                    </div>
                </div>
                <button onClick={onLogout} className="border border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-2 mt-4 sm:mt-0 text-sm transition-colors uppercase">
                    SAIR
                </button>
            </header>
            
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <main className="xl:col-span-3">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl uppercase tracking-wider">Arquivos de Operativos</h2>
                        <button onClick={handleCreateCharacter} className="border border-gray-700 text-gray-200 hover:bg-gray-800 px-4 py-2 text-sm transition-colors uppercase">
                            + Novo Arquivo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {characters.length > 0 ? (
                            characters.map(char => {
                                const { url: currentImageUrl, isDying } = getCurrentImage(char);
                                const isDropTarget = dropTargetId === char.id;
                                return (
                                    <div 
                                        key={char.id} 
                                        className={`bg-black/70 backdrop-blur-sm border p-4 flex flex-col sm:flex-row gap-4 transition-all duration-200 ${isDropTarget ? 'border-cyan-400 border-2 shadow-lg shadow-cyan-500/20' : 'border-gray-700 hover:border-gray-500'}`}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDragEnter={(e) => { e.preventDefault(); setDropTargetId(char.id); }}
                                        onDragLeave={() => setDropTargetId(null)}
                                        onDrop={(e) => handleDrop(e, char.id)}
                                    >
                                        <div className="flex-shrink-0 w-24 h-24 bg-black border border-gray-800 rounded-full mx-auto sm:mx-0">
                                            {currentImageUrl ? (
                                                <img src={currentImageUrl} alt={char.personalDetails.name} className={`w-full h-full object-cover rounded-full transition-all ${isDying ? 'filter brightness-50' : ''}`} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs text-center">SEM IMAGEM</div>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-xl text-gray-100">{char.personalDetails.name}</h3>
                                            {char.archetype && char.archetype !== 'Nenhum' && (
                                                <p className="text-sm text-cyan-400 tracking-wider -mt-1">{char.archetype}</p>
                                            )}
                                            <p className="text-sm text-gray-500 mb-2">{char.personalDetails.occupation || 'Nenhuma Ocupação Atribuída'}</p>
                                            
                                            <div className="flex flex-col gap-1 text-xs mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-20 text-gray-400 flex-shrink-0">VITALIDADE:</span>
                                                    <div className="flex-grow"><MiniStatBar current={char.stats.life.current} max={char.stats.life.max} color="bg-green-500" /></div>
                                                    <span className="w-16 text-right text-gray-300">{char.stats.life.current}/{char.stats.life.max}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-20 text-gray-400 flex-shrink-0">ESTABILIDADE:</span>
                                                    <div className="flex-grow"><MiniStatBar current={char.stats.sanity.current} max={char.stats.sanity.max} color="bg-cyan-500" /></div>
                                                    <span className="w-16 text-right text-gray-300">{char.stats.sanity.current}/{char.stats.sanity.max}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-20 text-gray-400 flex-shrink-0">EXPOSIÇÃO:</span>
                                                    <div className="flex-grow"><MiniStatBar current={char.stats.occultism.current} max={char.stats.occultism.max} color="bg-fuchsia-500" /></div>
                                                    <span className="w-16 text-right text-gray-300">{char.stats.occultism.current}/{char.stats.occultism.max}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-2">
                                                <h4 className="text-sm text-gray-400 uppercase mb-1">Equipamento</h4>
                                                {char.inventory.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {char.inventory.map(item => (
                                                            <span key={item.id} className="bg-gray-800/70 text-gray-300 text-xs px-2 py-0.5 rounded-sm">{item.name}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-600 italic">Inventário vazio.</p>
                                                )}
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-800 flex flex-wrap gap-2 items-center">
                                                <button onClick={() => onNavigate(`#/character/${char.id}`)} className="border border-gray-600 text-gray-300 hover:bg-gray-800 px-3 py-1 text-xs transition-colors">ABRIR</button>
                                                <button onClick={() => setGrantingPointsFor(char)} className="border border-gray-600 text-gray-300 hover:bg-gray-800 px-3 py-1 text-xs transition-colors">CONCEDER PONTOS</button>
                                                <button onClick={() => handleCopyLink(char.id, 'sheet')} className={`border border-gray-600 hover:bg-gray-800 px-3 py-1 text-xs transition-colors w-24 ${copiedInfo?.id === char.id && copiedInfo.type === 'sheet' ? 'text-white font-bold' : 'text-gray-300'}`}>{copiedInfo?.id === char.id && copiedInfo.type === 'sheet' ? 'COPIADO!' : 'COPIAR LINK'}</button>
                                                <button onClick={() => handleCopyLink(char.id, 'portrait')} className={`border border-gray-600 hover:bg-gray-800 px-3 py-1 text-xs transition-colors w-32 ${copiedInfo?.id === char.id && copiedInfo.type === 'portrait' ? 'text-white font-bold' : 'text-gray-300'}`}>{copiedInfo?.id === char.id && copiedInfo.type === 'portrait' ? 'COPIADO!' : 'COPIAR RETRATO'}</button>
                                                <button onClick={() => handleDeleteCharacter(char.id, char.personalDetails.name)} className="border border-gray-600 text-gray-300 hover:text-red-400 hover:border-red-500 hover:bg-red-900/50 px-3 py-1 text-xs transition-colors">EXCLUIR</button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-center text-gray-600 p-8 col-span-full">NENHUM ARQUIVO DE OPERATIVO ENCONTRADO NO ARQUIVO.</p>
                        )}
                    </div>
                </main>
                <aside className="xl:col-span-1">
                    <div className="sticky top-8 bg-black/70 backdrop-blur-sm border border-gray-700 p-4">
                        <div className="flex border-b border-gray-700 mb-4">
                            <button 
                                onClick={() => setActiveSidebarTab('items')}
                                className={`flex-1 p-2 text-center uppercase tracking-wider transition-colors ${activeSidebarTab === 'items' ? 'text-white bg-gray-800/50' : 'text-gray-500 hover:bg-gray-800/30'}`}
                            >
                                Depósito
                            </button>
                            <button
                                onClick={() => setActiveSidebarTab('rituals')}
                                className={`flex-1 p-2 text-center uppercase tracking-wider transition-colors ${activeSidebarTab === 'rituals' ? 'text-white bg-gray-800/50' : 'text-gray-500 hover:bg-gray-800/30'}`}
                            >
                                Grimório
                            </button>
                        </div>

                        {activeSidebarTab === 'items' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl uppercase tracking-wider">Itens</h2>
                                    <button onClick={() => setCreatingItem(true)} className="border border-gray-600 hover:bg-gray-800 px-3 py-1 text-xs transition-colors">+</button>
                                </div>
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                   {masterItems.map((item, index) => (
                                       <div 
                                         key={index}
                                         draggable="true"
                                         onDragStart={(e) => handleDragStart(e, item)}
                                         className="border border-gray-700 bg-gray-900/50 p-2 cursor-grab active:cursor-grabbing hover:bg-gray-800"
                                       >
                                          <p className="font-bold text-gray-200">{item.name}</p>
                                          <p className="text-xs text-gray-400">{item.description}</p>
                                       </div>
                                   ))}
                                </div>
                            </div>
                        )}

                        {activeSidebarTab === 'rituals' && (
                             <div>
                                <div className="flex justify-between items-center mb-4">
                                     <h2 className="text-2xl uppercase tracking-wider">Rituais</h2>
                                     <button onClick={() => setEditingRitual({ id: '', name: '', description: '', cost: '', execution: '', range: '', duration: '', invocationSign: 'fragmentado' })} className="border border-gray-600 hover:bg-gray-800 px-3 py-1 text-xs transition-colors">+</button>
                                 </div>
                                 <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                    {masterRituals.map((ritual) => (
                                        <div key={ritual.id} className="border border-gray-700 bg-gray-900/50 p-3 flex gap-4 items-center group">
                                            <div className="w-12 h-12 flex-shrink-0 p-1 text-yellow-400">
                                                <RitualSignSelector signKey={ritual.invocationSign} />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-bold text-gray-200 text-lg">{ritual.name}</p>
                                                <p className="text-xs text-gray-400">{ritual.description}</p>
                                            </div>
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setViewingRitual(ritual)} className="text-xs border border-gray-600 px-2 py-0.5 hover:bg-gray-800">Ver</button>
                                                <button onClick={() => setEditingRitual(ritual)} className="text-xs border border-gray-600 px-2 py-0.5 hover:bg-gray-800">Editar</button>
                                            </div>
                                        </div>
                                    ))}
                                 </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
            {grantingPointsFor && (
                <GrantPointsModal 
                    character={grantingPointsFor}
                    onClose={() => setGrantingPointsFor(null)}
                    onSave={handleGrantPoints}
                />
            )}
             {creatingItem && (
                <CreateItemModal 
                    onClose={() => setCreatingItem(false)}
                    onSave={handleSaveNewMasterItem}
                />
            )}
            {viewingRitual && <RitualDetailsModal ritual={viewingRitual} onClose={() => setViewingRitual(null)} />}
            {editingRitual !== undefined && <RitualEditorModal ritual={editingRitual.id ? editingRitual : undefined} onSave={handleSaveRitual} onClose={() => setEditingRitual(undefined)} />}
        </div>
    );
};

// --- PORTRAIT MODE FOR STREAMING ---
const PortraitStatBar: React.FC<{ label: string; stat: Stat; color: string; }> = ({ label, stat, color }) => {
    const percentage = stat.max > 0 ? (stat.current / stat.max) * 100 : 0;
    return (
        <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-2xl uppercase tracking-wider">{label}</h3>
                <span className="text-2xl font-bold">{stat.current} / {stat.max}</span>
            </div>
            <div className="w-full bg-black/60 border-2 border-gray-500/80 h-8 overflow-hidden">
                <div className={`h-full transition-all duration-500 ease-linear ${color}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const PortraitPage: React.FC<{ characterId: string }> = ({ characterId }) => {
    const [character, setCharacter] = useState<Character | null>(null);

    // Poll localStorage for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            const charData = getCharacter(characterId);
            if (charData) {
                setCharacter(prevChar => JSON.stringify(prevChar) !== JSON.stringify(charData) ? charData : prevChar);
            }
        }, 1000);

        const charData = getCharacter(characterId);
        if (charData) setCharacter(charData);
        else console.log("Personagem não encontrado");
        
        document.body.classList.add('portrait-mode');
        return () => {
            clearInterval(interval);
            document.body.classList.remove('portrait-mode');
        };
    }, [characterId]);

    if (!character) {
        return <div className="flex items-center justify-center min-h-screen bg-transparent text-gray-200">CARREGANDO RETRATO...</div>;
    }
    
    const { url: currentImageUrl, isDying } = getCurrentImage(character);

    return (
        <div className="bg-transparent text-gray-200 p-4 w-[600px] h-[300px] flex gap-4">
            <div className={`w-1/2 h-full flex-shrink-0 border-4 shadow-[0_0_15px_rgba(255,255,255,0.2)] bg-black transition-all ${isDying ? 'border-red-500/50' : 'border-gray-400/80'}`}>
                 {currentImageUrl ? (
                    <img src={currentImageUrl} alt={character.personalDetails.name} className={`w-full h-full object-cover transition-all ${isDying ? 'filter brightness-50' : ''}`} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg text-center">SEM IMAGEM</div>
                )}
            </div>
            <div className="w-1/2 h-full flex flex-col justify-between">
                <h1 className="text-4xl text-center uppercase tracking-widest leading-tight text-shadow-lg">{character.personalDetails.name}</h1>
                <div className="flex-grow flex flex-col justify-end">
                    <PortraitStatBar label="Vitalidade" stat={character.stats.life} color="bg-green-500" />
                    <PortraitStatBar label="Estabilidade" stat={character.stats.sanity} color="bg-cyan-500" />
                    <PortraitStatBar label="Exposição" stat={character.stats.occultism} color="bg-fuchsia-500" />
                </div>
            </div>
        </div>
    );
};

// --- IMAGE MANAGER COMPONENT ---
const ImageManager: React.FC<{
    imageSet: ImageSet;
    onSave: (newImageSet: ImageSet) => void;
    onClose: () => void;
}> = ({ imageSet, onSave, onClose }) => {
    const [localImageSet, setLocalImageSet] = useState(imageSet);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newVariant = reader.result as string;
                    setLocalImageSet(prev => {
                        const updatedVariants = [...prev.variants, newVariant];
                        const newBase = prev.base === null ? newVariant : prev.base;
                        return { ...prev, variants: updatedVariants, base: newBase };
                    });
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleSetBase = (variant: string) => {
        setLocalImageSet(prev => ({ ...prev, base: variant }));
    };
    
    const handleDeleteVariant = (variantToDelete: string) => {
        setLocalImageSet(prev => ({
            ...prev,
            variants: prev.variants.filter(v => v !== variantToDelete),
            base: prev.base === variantToDelete ? (prev.variants.filter(v => v !== variantToDelete)[0] || null) : prev.base,
            wounded: prev.wounded === variantToDelete ? null : prev.wounded,
            critical: prev.critical === variantToDelete ? null : prev.critical,
        }));
    };

    const handleAssignStateImage = (state: 'wounded' | 'critical', variant: string | null) => {
         setLocalImageSet(prev => ({ ...prev, [state]: variant }));
    };
    
    const handleSaveAndClose = () => {
        onSave(localImageSet);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-black border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col p-6 shadow-2xl shadow-black">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl uppercase tracking-widest">Gerenciador de Retratos</h2>
                    <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                    <div className="mb-6">
                         <h3 className="text-lg uppercase text-gray-400 mb-2">Galeria de Variantes</h3>
                         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 mb-4">
                            {localImageSet.variants.map((variant, i) => (
                                <div key={i} className={`relative group border-2 ${localImageSet.base === variant ? 'border-gray-200 shadow-lg shadow-gray-400/20' : 'border-transparent'}`}>
                                    <img src={variant} className="w-full h-32 object-cover" alt={`Variant ${i+1}`} />
                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs p-1">
                                        <button onClick={() => handleSetBase(variant)} className="w-full text-center hover:bg-gray-800 p-1 rounded">Usar como Base</button>
                                        <button onClick={() => handleDeleteVariant(variant)} className="w-full text-center hover:bg-red-900/50 text-red-400 p-1 rounded mt-1">Excluir</button>
                                    </div>
                                </div>
                            ))}
                            <label className="w-full h-32 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-800/50 hover:border-gray-400 cursor-pointer transition-colors">
                                <span className="text-3xl">+</span>
                                <span>Adicionar</span>
                                <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                            </label>
                         </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg uppercase text-gray-400 mb-2">Retrato Ferido <span className="text-gray-500 text-sm normal-case">(Ativado em &lt;= 50% vida)</span></h3>
                            <div className="flex gap-4 items-center">
                                <div className="w-32 h-32 bg-black border border-gray-700 flex-shrink-0">
                                    {localImageSet.wounded && <img src={localImageSet.wounded} className="w-full h-full object-cover" alt="Retrato Ferido"/>}
                                </div>
                                <div className="flex flex-col">
                                    <select 
                                        value={localImageSet.wounded || ''}
                                        onChange={(e) => handleAssignStateImage('wounded', e.target.value || null)}
                                        className="bg-black/50 border border-gray-600 p-2 mb-2 text-gray-200"
                                        disabled={localImageSet.variants.length === 0}
                                    >
                                        <option value="">Nenhum</option>
                                        {localImageSet.variants.map((v, i) => <option key={i} value={v}>Variante {i+1}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500">Selecione uma imagem da sua galeria para ser usada quando a vida estiver baixa.</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg uppercase text-gray-400 mb-2">Retrato Crítico <span className="text-gray-500 text-sm normal-case">(Ativado em &lt;= 25% vida)</span></h3>
                             <div className="flex gap-4 items-center">
                                <div className="w-32 h-32 bg-black border border-gray-700 flex-shrink-0">
                                    {localImageSet.critical && <img src={localImageSet.critical} className="w-full h-full object-cover" alt="Retrato Crítico"/>}
                                </div>
                                <div className="flex flex-col">
                                    <select 
                                        value={localImageSet.critical || ''}
                                        onChange={(e) => handleAssignStateImage('critical', e.target.value || null)}
                                        className="bg-black/50 border border-gray-600 p-2 mb-2 text-gray-200"
                                        disabled={localImageSet.variants.length === 0}
                                    >
                                        <option value="">Nenhum</option>
                                        {localImageSet.variants.map((v, i) => <option key={i} value={v}>Variante {i+1}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500">Selecione uma imagem para ser usada quando a vida estiver em estado crítico.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-700 text-right flex-shrink-0">
                    <button onClick={handleSaveAndClose} className="border border-gray-600 hover:bg-gray-800 p-3 text-lg transition-all uppercase text-gray-200 px-8">Salvar e Fechar</button>
                </div>
            </div>
        </div>
    );
};

const AttributeRollModal: React.FC<{ result: RollResult; onClose: () => void }> = ({ result, onClose }) => {
    if (result.type !== 'attribute' || !result.outcome || result.targetValue === undefined) {
        return null;
    }

    const outcomeColors: Record<RollOutcome, { text: string; bg: string; border: string; shadow: string; }> = {
        'Sucesso Crítico': { text: 'text-yellow-300', bg: 'bg-yellow-900/30', border: 'border-yellow-400/50', shadow: 'shadow-yellow-400/20' },
        'Sucesso Bom': { text: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/50', shadow: 'shadow-green-500/20' },
        'Sucesso': { text: 'text-cyan-400', bg: 'bg-cyan-900/30', border: 'border-cyan-500/50', shadow: 'shadow-cyan-500/20' },
        'Fracasso': { text: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50', shadow: 'shadow-red-500/20' },
        'Fracasso Crítico': { text: 'text-red-500 font-bold', bg: 'bg-red-900/50', border: 'border-red-600/70', shadow: 'shadow-red-600/30' },
    };

    const colors = outcomeColors[result.outcome];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className={`bg-black border ${colors.border} w-full max-w-sm p-8 shadow-2xl ${colors.shadow} text-center`}>
                <h2 className="text-2xl text-gray-400 uppercase tracking-widest">Teste de {result.source}</h2>
                
                <div className="my-8 flex justify-center items-center">
                    <D20Icon value={result.rollValue} className="w-40 h-40 text-gray-200" />
                </div>

                <h3 className={`text-4xl uppercase tracking-wider mb-2 ${colors.text}`}>{result.outcome}</h3>
                <p className="text-gray-500 mb-8">Rolagem: {result.rollValue} vs Alvo: {result.targetValue}</p>
                
                <button 
                    onClick={onClose}
                    className="border border-gray-600 hover:bg-gray-800 p-3 text-lg transition-all uppercase text-gray-200 px-12 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};


// --- MAIN CHARACTER SHEET & HELPERS ---
const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`border border-gray-800/80 p-4 bg-black/70 backdrop-blur-sm ${className}`}>
    <h2 className="text-xl uppercase mb-3 text-gray-200 tracking-widest">{title}</h2>
    {children}
  </div>
);

const personalDetailsLabels: { [key in keyof Character['personalDetails']]: string } = {
    name: "Nome",
    player: "Jogador",
    occupation: "Ocupação",
    age: "Idade",
    gender: "Gênero",
    birthplace: "Local de Nascimento",
    residence: "Residência",
};

const EditableField: React.FC<{ label: string; value: string; onSave: (value: string) => void; }> = ({ label, value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-baseline mb-2">
      <label className="w-1/3 text-gray-500 uppercase text-sm">{label}</label>
      {isEditing ? (
        <input
          type="text"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-b border-gray-600 focus:border-gray-300 outline-none w-2/3 text-gray-200"
          autoFocus
        />
      ) : (
        <span onClick={() => setIsEditing(true)} className="w-2/3 cursor-pointer hover:bg-gray-800/50 p-1 text-gray-200">
          {value || '...'}
        </span>
      )}
    </div>
  );
};

const StatusBar: React.FC<{ label: string; stat: Stat; onSave: (newStat: Stat) => void; color: string; labels: [string, string, string] }> = ({ label, stat, onSave, color, labels }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [current, setCurrent] = useState(stat.current);
    const [max, setMax] = useState(stat.max);
    
    useEffect(() => {
        setCurrent(stat.current);
        setMax(stat.max);
    }, [stat]);

    const percentage = stat.max > 0 ? (stat.current / stat.max) * 100 : 0;

    const handleSave = () => {
        onSave({ current: Number(current), max: Number(max) });
        setIsEditing(false);
    }
    
    const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newCurrent = Math.min(stat.max, Math.max(0, Math.round((clickX / rect.width) * stat.max)));
        onSave({ ...stat, current: newCurrent });
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg uppercase text-gray-200">{label}</h3>
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input type="number" value={current} onChange={e => setCurrent(Number(e.target.value))} className="w-16 bg-black/50 border border-gray-700 text-center text-gray-200" />
                        <span className="text-gray-400">/</span>
                        <input type="number" value={max} onChange={e => setMax(Number(e.target.value))} className="w-16 bg-black/50 border border-gray-700 text-center text-gray-200" />
                        <button onClick={handleSave} className="text-gray-300 text-xs">SALVAR</button>
                    </div>
                ) : (
                    <span className="cursor-pointer text-gray-200" onClick={() => setIsEditing(true)}>
                        {stat.current} / {stat.max}
                    </span>
                )}
            </div>
            <div className="w-full bg-black/50 border border-gray-700 h-6 p-0.5 cursor-pointer" onClick={handleBarClick}>
                <div className={`h-full transition-all duration-300 ${color}`} style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{labels[0]}</span>
                <span>{labels[1]}</span>
                <span>{labels[2]}</span>
            </div>
        </div>
    );
};

const archetypes: { [key in Exclude<Archetype, 'Nenhum'>]: { name: string; description: string } } = {
    Combatente: {
        name: "Combatente",
        description: "Focado em combate físico e habilidades de luta, utilizando armas e técnicas de combate corpo a corpo."
    },
    Especialista: {
        name: "Especialista",
        description: "Habilidades que envolvem conhecimento, investigação e uso de ferramentas, como itens paranormais ou tecnologia."
    },
    Ocultista: {
        name: "Ocultista",
        description: "Capacidade de manipular energia paranormal, realizar rituais e usar poderes relacionados ao Outro Lado."
    }
};

const MaskFormSection: React.FC<{ form: MaskForm }> = ({ form }) => {
    const data = maskFormsData[form];
    if (!data) return null;

    return (
        <Section title={`FORMA ATIVA: ${data.name}`} className="border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/10">
            <p className="text-fuchsia-300 italic mb-2">{data.description}</p>
            <p className="whitespace-pre-wrap"><span className="text-gray-400 uppercase text-sm">Poderes: </span>{data.passive}</p>
        </Section>
    );
};

const CharacterSheetPage: React.FC<{ characterId: string; onNavigate: (path: string) => void; isMaster: boolean; }> = ({ characterId, onNavigate, isMaster }) => {
    const [character, setCharacter] = useState<Character | null>(null);
    const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
    const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
    const [attributeRollResult, setAttributeRollResult] = useState<RollResult | null>(null);

    useEffect(() => {
        const charData = getCharacter(characterId);
        if (charData) {
            setCharacter(charData);
        } else {
            onNavigate('#/dashboard');
        }
    }, [characterId, onNavigate]);

    // This effect saves the character on any change.
    useEffect(() => {
        if (character) {
            const { id, ...charData } = character;
            updateCharacter(id, charData);
        }
    }, [character]);

    const handleCharacterUpdate = useCallback((updater: (char: Character) => Character) => {
        setCharacter(prev => (prev ? updater(prev) : null));
    }, []);

    // Centralized effect for handling all temporary items/forms
    useEffect(() => {
        if (!character) return;
        
        const masterTemplates = getMasterItemTemplates();

        let nextCombat = character.combat.filter(w => !w.isMaskWeapon && !w.isTarotCard && !w.linkedItemId);
        let nextRituals = character.rituals.filter(r => !r.isMaskRitual && !r.isTarotRitual);
        
        // --- Handle Linked Inventory Weapons ---
        character.inventory.forEach(item => {
            const template = masterTemplates.find(t => t.name === item.name && t.weapon);
            if (template && template.weapon) {
                const existingWeapon = character.combat.find(w => w.linkedItemId === item.id);
                 if (!nextCombat.some(w => w.linkedItemId === item.id)) {
                    nextCombat.push({
                        id: `linked_${item.id}`,
                        name: template.name,
                        ...template.weapon,
                        currentAmmo: existingWeapon ? existingWeapon.currentAmmo : (template.weapon.maxAmmo || 0),
                        linkedItemId: item.id
                    });
                }
            }
        });

        // --- Handle Tarot Deck ---
        const hasTarotDeck = character.inventory.some(item => item.name.toLowerCase() === 'baralho de tarot');
        if (hasTarotDeck) {
            tarotCardWeaponsData.forEach(tw => {
                if (!nextCombat.some(w => w.name === tw.name && w.isTarotCard)) {
                    nextCombat.push({ ...tw, id: `tarot_w_${tw.name.replace(/\s/g, '')}`, isTarotCard: true });
                }
            });
            tarotCardRitualsData.forEach(tr => {
                 if (!nextRituals.some(r => r.name === tr.name && r.isTarotRitual)) {
                    nextRituals.push({ ...tr, id: `tarot_r_${tr.name.replace(/\s/g, '')}`, isTarotRitual: true });
                }
            });
        }

        // --- Handle Mask Form ---
        if (character.maskForm) {
            const formData = maskFormsData[character.maskForm];
            if (formData.weapon && !nextCombat.some(w => w.isMaskWeapon)) {
                nextCombat.push({ ...formData.weapon, id: `mask_w_${Date.now()}` });
            }
            if (formData.rituals) {
                formData.rituals.forEach(r => {
                    if (!nextRituals.some(nr => nr.name === r.name && nr.isMaskRitual)) {
                        nextRituals.push({ ...r, id: `mask_r_${r.name.replace(/\s/g, '')}_${Date.now()}`});
                    }
                });
            }
        }
        
        if (character.maskForm && character.stats.occultism.current < character.stats.occultism.max) {
             handleCharacterUpdate(c => ({ ...c, maskForm: null }));
            return;
        }

        const currentCombatIds = character.combat.map(c => c.id).sort().join(',');
        const nextCombatIds = nextCombat.map(c => c.id).sort().join(',');
        const currentRitualIds = character.rituals.map(r => r.id).sort().join(',');
        const nextRitualIds = nextRituals.map(r => r.id).sort().join(',');

        if (currentCombatIds !== nextCombatIds || currentRitualIds !== nextRitualIds) {
            handleCharacterUpdate(c => ({
                ...c,
                combat: nextCombat,
                rituals: nextRituals
            }));
        }

    }, [character?.inventory, character?.maskForm, character?.stats.occultism.current, handleCharacterUpdate]);


    const handleMaskClick = useCallback(() => {
        if (!character || character.maskForm) return;

        const roll = Math.floor(Math.random() * 6);
        const formKeys = Object.keys(maskFormsData) as MaskForm[];
        const newForm = formKeys[roll];
        
        handleCharacterUpdate(c => ({ ...c, maskForm: newForm }));

    }, [character, handleCharacterUpdate]);


    const handleImageSetSave = (newImageSet: ImageSet) => {
        handleCharacterUpdate(c => ({...c, imageSet: newImageSet }));
    };

    const handleDetailChange = (field: keyof Character['personalDetails'], value: string) => 
        handleCharacterUpdate(c => ({ ...c, personalDetails: { ...c.personalDetails, [field]: value } }));

    const handleStatChange = (field: keyof Character['stats'], value: Stat) =>
        handleCharacterUpdate(c => ({ ...c, stats: { ...c.stats, [field]: value } }));

    const handleAttributeChange = (index: number, value: number) => 
        handleCharacterUpdate(c => {
            const newAttributes = [...c.attributes];
            const oldAttribute = newAttributes[index];
            const cost = value - oldAttribute.value;
            
            if (cost > c.attributePoints) {
                alert(`Pontos de atributo insuficientes! Necessário: ${cost}, Disponível: ${c.attributePoints}`);
                return c;
            }

            newAttributes[index] = { ...newAttributes[index], value };
            return { ...c, attributes: newAttributes, attributePoints: c.attributePoints - cost };
        });
        
    const handleManualRoll = (sides: DiceType) => {
        const result = Math.floor(Math.random() * sides) + 1;
        const newRoll: RollResult = {
            id: Date.now(),
            type: 'manual',
            source: String(sides),
            rollValue: result,
        };
        setRollHistory(prev => [newRoll, ...prev.slice(0, 19)]);
    };
    
    const handleAttributeRoll = (attribute: Attribute) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        let outcome: RollOutcome;

        if (roll === 1) outcome = 'Sucesso Crítico';
        else if (roll === 20) outcome = 'Fracasso Crítico';
        else if (roll <= attribute.value / 2) outcome = 'Sucesso Bom';
        else if (roll <= attribute.value) outcome = 'Sucesso';
        else outcome = 'Fracasso';
        
        const newRoll: RollResult = {
            id: Date.now(),
            type: 'attribute',
            source: attribute.name,
            rollValue: roll,
            targetValue: attribute.value,
            outcome: outcome,
        };
        setRollHistory(prev => [newRoll, ...prev.slice(0, 19)]);
        setAttributeRollResult(newRoll);
    };


    const handleSkillChange = (id: string, field: 'name' | 'value', value: string | number) =>
        handleCharacterUpdate(c => {
            const oldSkill = c.skills.find(skill => skill.id === id);
            if (!oldSkill || field === 'name') {
                 return { ...c, skills: c.skills.map(skill => skill.id === id ? { ...skill, [field]: value } : skill) };
            }

            const newValue = Number(value);
            const cost = newValue - oldSkill.value;
            
            if (cost > c.skillPoints) {
                alert(`Pontos de perícia insuficientes! Necessário: ${cost}, Disponível: ${c.skillPoints}`);
                return c;
            }
            
            return {
                ...c,
                skills: c.skills.map(skill => skill.id === id ? { ...skill, value: newValue } : skill),
                skillPoints: c.skillPoints - cost,
            };
        });

    const toggleSkillFavorite = (id: string) =>
        handleCharacterUpdate(c => ({
            ...c,
            skills: c.skills.map(skill => skill.id === id ? { ...skill, isFavorite: !skill.isFavorite } : skill)
        }));

    const addSkill = () =>
        handleCharacterUpdate(c => {
            const newSkillCost = 10;
            if (c.skillPoints < newSkillCost) {
                alert(`Pontos de perícia insuficientes para adicionar uma nova perícia! Necessário: ${newSkillCost}, Disponível: ${c.skillPoints}`);
                return c;
            }
            return {
                ...c,
                skills: [...c.skills, { id: Date.now().toString(), name: 'Nova Perícia', value: newSkillCost, isFavorite: false }],
                skillPoints: c.skillPoints - newSkillCost
            };
        });

    const removeSkill = (id: string) =>
        handleCharacterUpdate(c => {
            const skillToRemove = c.skills.find(s => s.id === id);
            if (!skillToRemove) return c;
            
            return {
                ...c,
                skills: c.skills.filter(skill => skill.id !== id),
                skillPoints: c.skillPoints + skillToRemove.value
            };
        });

    const handleCombatChange = (index: number, field: keyof Weapon, value: string | number) => 
        handleCharacterUpdate(c => {
            const newCombat = [...c.combat];
            const weaponToUpdate = { ...newCombat[index] };
            // @ts-ignore
            weaponToUpdate[field] = value;
            newCombat[index] = weaponToUpdate;
            return { ...c, combat: newCombat };
        });

    const addWeapon = () => 
        handleCharacterUpdate(c => ({ ...c, combat: [...c.combat, {
            id: Date.now().toString(), name: 'Nova Arma', type: '', damage: '', currentAmmo: 0, maxAmmo: 0,
            attacks: '1', range: '', malfunction: '', area: '',
        }]}));

    const removeWeapon = (id: string) => 
        handleCharacterUpdate(c => ({ ...c, combat: c.combat.filter(w => w.id !== id) }));

    const handleRitualChange = (index: number, field: keyof Ritual, value: string) =>
        handleCharacterUpdate(c => {
            const newRituals = [...c.rituals];
            const ritualToUpdate = { ...newRituals[index] };
            // @ts-ignore
            ritualToUpdate[field] = value;
            newRituals[index] = ritualToUpdate;
            return { ...c, rituals: newRituals };
        });
    
    const addRitual = () =>
        handleCharacterUpdate(c => ({ ...c, rituals: [...c.rituals, {
            id: Date.now().toString(), name: 'Novo Ritual', cost: '', execution: '',
            range: '', duration: '', description: ''
        }]}));

    const removeRitual = (id: string) =>
        handleCharacterUpdate(c => ({ ...c, rituals: c.rituals.filter(r => r.id !== id) }));

    const maxWeight = useMemo(() => {
        if (!character) return 0;
        const strength = character.attributes.find(a => a.name === 'Força')?.value || 10;
        return strength * 2.5;
    }, [character]);

    const totalWeight = useMemo(() => {
        if (!character) return 0;
        const backpacks = character.inventory.filter(item =>
            item.name.toLowerCase() === 'mochila' && item.weight === 3 && item.width === 6 && item.height === 10
        );
        const backpackIds = backpacks.map(b => b.id);

        return character.inventory.reduce((sum, item) => {
            if (item.containerId && backpackIds.includes(item.containerId)) {
                return sum + (item.weight * 0.5); // 50% less weight
            }
            return sum + item.weight;
        }, 0);
    }, [character]);

    if (!character) {
        return <div className="flex items-center justify-center min-h-screen">CARREGANDO ARQUIVO...</div>;
    }
    
    const favoriteSkills = character.skills.filter(s => s.isFavorite);
    const { url: currentImageUrl, isDying } = getCurrentImage(character);

    return (
        <div className="text-gray-200 min-h-screen p-4 md:p-8">
            <header className="flex flex-col sm:flex-row items-center justify-between w-full mb-8">
                <div className="flex-1 flex justify-start">
                    {isMaster && (
                        <button 
                            onClick={() => onNavigate('#/dashboard')} 
                            className="border border-gray-600 hover:bg-gray-800 px-4 py-2 text-sm transition-colors"
                        >
                            &larr; VOLTAR AO PAINEL DE CONTROLE
                        </button>
                    )}
                </div>
                <div className="flex flex-col items-center">
                    <LogoIcon />
                    <h1 className="text-4xl uppercase tracking-[0.2em] mt-2">Perfil do Operativo</h1>
                    <p className="text-sm text-gray-500">//ARSENAL.LOG</p>
                </div>
                <div className="flex-1"></div>
            </header>
            
            <main className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <Section title="DADOS PESSOAIS">
                        {Object.entries(character.personalDetails).map(([key, value]) => (
                            <EditableField 
                                key={key} 
                                label={personalDetailsLabels[key as keyof typeof personalDetailsLabels]}
                                value={value} 
                                onSave={(newValue) => handleDetailChange(key as keyof Character['personalDetails'], newValue)}
                            />
                        ))}
                    </Section>
                    
                    <Section title={`ATRIBUTOS (${character.attributePoints} PONTOS)`}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6 mb-6">
                            {character.attributes.map((attr, index) => (
                                <div key={attr.name} className="text-center">
                                    <div className="flex justify-center items-center">
                                        <button
                                            onClick={() => handleAttributeRoll(attr)}
                                            className="group relative transition-transform hover:scale-105 focus:outline-none"
                                            aria-label={`Testar ${attr.name}`}
                                        >
                                            <D20Icon value={attr.value}/>
                                            <div className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover:opacity-80 flex items-center justify-center transition-opacity">
                                                 <span className="text-white text-xs">TESTAR</span>
                                            </div>
                                        </button>
                                    </div>
                                    <span className="uppercase text-sm text-gray-300">{attr.name}</span>
                                    <input 
                                        type="number"
                                        value={attr.value}
                                        onChange={(e) => handleAttributeChange(index, parseInt(e.target.value) || 0)}
                                        className="w-16 bg-transparent border-b border-gray-700 text-center focus:outline-none focus:border-gray-300 mt-1 text-gray-200"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <EditableField label="Movimento" value={String(character.movement)} onSave={(v) => handleCharacterUpdate(c => ({...c, movement: Number(v)}))}/>
                            <EditableField label="Tamanho" value={String(character.size)} onSave={(v) => handleCharacterUpdate(c => ({...c, size: Number(v)}))}/>
                        </div>
                    </Section>

                    <Section title="COMBATE">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-gray-700 text-gray-300">
                                        {['Nome', 'Tipo', 'Dano', 'Mun. Atual', 'Ataques', 'Alcance', 'Defeito', ''].map(h => <th key={h} className="p-2 uppercase font-normal tracking-wider">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {character.combat.map((weapon, index) => {
                                        const isImmutable = weapon.isMaskWeapon || weapon.isTarotCard || !!weapon.linkedItemId || weapon.isUnarmed;
                                        const rowClass = `${weapon.isMaskWeapon ? 'text-fuchsia-300' : ''} ${weapon.isTarotCard ? 'text-amber-400' : ''}`;
                                        return (
                                            <tr key={weapon.id} className={`border-b border-gray-800 hover:bg-gray-800/50 ${rowClass}`}>
                                                <td className="p-1"><input type="text" value={weapon.name} onChange={e => handleCombatChange(index, 'name', e.target.value)} className="bg-transparent w-full focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable} /></td>
                                                <td className="p-1"><input type="text" value={weapon.type} onChange={e => handleCombatChange(index, 'type', e.target.value)} className="bg-transparent w-20 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable}/></td>
                                                <td className="p-1"><input type="text" value={weapon.damage} onChange={e => handleCombatChange(index, 'damage', e.target.value)} className="bg-transparent w-16 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable}/></td>
                                                <td className="p-1"><input type="number" value={weapon.currentAmmo} onChange={e => handleCombatChange(index, 'currentAmmo', Number(e.target.value))} className="bg-transparent w-16 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={weapon.isMaskWeapon || weapon.isTarotCard || weapon.isUnarmed}/></td>
                                                <td className="p-1"><input type="text" value={weapon.attacks} onChange={e => handleCombatChange(index, 'attacks', e.target.value)} className="bg-transparent w-12 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable}/></td>
                                                <td className="p-1"><input type="text" value={weapon.range} onChange={e => handleCombatChange(index, 'range', e.target.value)} className="bg-transparent w-16 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable}/></td>
                                                <td className="p-1"><input type="text" value={weapon.malfunction} onChange={e => handleCombatChange(index, 'malfunction', e.target.value)} className="bg-transparent w-16 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable}/></td>
                                                <td className="p-1 text-center"><button onClick={() => !isImmutable && removeWeapon(weapon.id)} className={`font-bold ${isImmutable ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-red-400'}`}>X</button></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={addWeapon} className="mt-4 border border-gray-600 hover:bg-gray-800 px-4 py-1 text-sm transition-colors">Adicionar Arma</button>
                    </Section>

                    <Section title={`LISTA DE PERÍCIAS (${character.skillPoints} PONTOS)`}>
                        <div className="space-y-2">
                            {character.skills.map((skill) => (
                                <div key={skill.id} className="flex items-center gap-2">
                                    <button onClick={() => toggleSkillFavorite(skill.id)} className="text-lg" aria-label="Marcar como favorita">
                                        {skill.isFavorite ? '★' : '☆'}
                                    </button>
                                    <input 
                                        type="text" 
                                        value={skill.name} 
                                        onChange={(e) => handleSkillChange(skill.id, 'name', e.target.value)}
                                        className="flex-grow bg-black/50 border border-transparent hover:border-gray-700 focus:border-gray-500 p-1 rounded-sm focus:outline-none"
                                    />
                                    <input 
                                        type="number" 
                                        value={skill.value} 
                                        onChange={(e) => handleSkillChange(skill.id, 'value', parseInt(e.target.value) || 0)}
                                        className="w-20 bg-black/50 border border-transparent hover:border-gray-700 focus:border-gray-500 p-1 rounded-sm focus:outline-none text-center"
                                    />
                                    <button onClick={() => removeSkill(skill.id)} className="text-gray-500 hover:text-red-400 font-bold px-2">X</button>
                                </div>
                            ))}
                        </div>
                         <button onClick={addSkill} className="mt-4 border border-gray-600 hover:bg-gray-800 px-4 py-1 text-sm transition-colors">Adicionar Perícia</button>
                    </Section>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row gap-6 bg-black/70 backdrop-blur-sm border border-gray-800 p-4">
                        <div className="flex-shrink-0 mx-auto">
                           <div className="w-40 h-40 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center text-gray-500 cursor-pointer relative group bg-black/50" onClick={() => setIsImageManagerOpen(true)}>
                                {currentImageUrl ? (
                                    <img src={currentImageUrl} alt="Personagem" className={`w-full h-full object-cover rounded-full transition-all ${isDying ? 'filter brightness-50' : ''}`} />
                                ) : (
                                    <span className="text-center text-sm">GERENCIAR RETRATOS</span>
                                )}
                                <div className="absolute inset-0 w-full h-full bg-black/70 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-gray-200">Alterar</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <StatusBar label="Vitalidade" stat={character.stats.life} onSave={v => handleStatChange('life', v)} color="bg-green-500" labels={['Crítico', 'Inconsciente', 'Morrendo']} />
                            <StatusBar label="Estabilidade" stat={character.stats.sanity} onSave={v => handleStatChange('sanity', v)} color="bg-cyan-500" labels={['Traumatizado', '', 'Enlouquecido']} />
                            <StatusBar label="Exposição" stat={character.stats.occultism} onSave={v => handleStatChange('occultism', v)} color="bg-fuchsia-500" labels={['Ignorante', 'Ciente', 'Exposto']} />
                        </div>
                    </div>
                    
                    <Section title="ARQUÉTIPO">
                        <div className="flex flex-col sm:flex-row gap-2 mb-3">
                            {Object.values(archetypes).map(({ name }) => (
                                <button
                                    key={name}
                                    onClick={() => handleCharacterUpdate(c => ({...c, archetype: name as Archetype}))}
                                    className={`flex-1 border p-2 text-sm uppercase transition-colors ${
                                        character.archetype === name
                                            ? 'bg-gray-200 text-black border-gray-200 shadow-md shadow-gray-400/20'
                                            : 'border-gray-600 hover:bg-gray-800'
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                        {character.archetype && character.archetype !== 'Nenhum' && (
                            <p className="text-gray-400 text-sm italic">
                                {archetypes[character.archetype as Exclude<Archetype, 'Nenhum'>].description}
                            </p>
                        )}
                    </Section>

                    {character.maskForm && <MaskFormSection form={character.maskForm} />}

                    <Section title="PERÍCIAS DE ACESSO RÁPIDO">
                        {favoriteSkills.length > 0 ? (
                             <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {favoriteSkills.map(skill => (
                                    <div key={skill.id} className="flex justify-between border-b border-gray-800/50 py-1">
                                        <span className="text-gray-300">{skill.name}</span>
                                        <span className="font-bold text-gray-100">{skill.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 text-sm text-center">Nenhuma perícia marcada para acesso rápido. Clique na estrela (☆) na lista de perícias.</p>
                        )}
                    </Section>

                    <Section title="INVENTÁRIO & CARGA" className="flex-grow">
                        <Inventory 
                            items={character.inventory} 
                            setItems={(newItems) => handleCharacterUpdate(c => ({...c, inventory: typeof newItems === 'function' ? newItems(c.inventory) : newItems}))} 
                            maxWeight={maxWeight}
                            totalWeight={totalWeight}
                            stats={character.stats}
                            onMaskClick={handleMaskClick}
                        />
                    </Section>
                </div>
            </main>

            <div className="mt-6 lg:col-span-5">
                <Section title="RITUAIS">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-300">
                                    {['Nome', 'Custo', 'Execução', 'Alcance', 'Duração', 'Descrição', ''].map(h => <th key={h} className="p-2 uppercase font-normal tracking-wider text-xs">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {character.rituals.map((ritual, index) => {
                                    const isImmutable = ritual.isMaskRitual || ritual.isTarotRitual;
                                    const rowClass = `${ritual.isMaskRitual ? 'text-fuchsia-300' : ''} ${ritual.isTarotRitual ? 'text-amber-400' : ''}`;
                                    return (
                                        <tr key={ritual.id} className={`border-b border-gray-800 hover:bg-gray-800/50 ${rowClass}`}>
                                            <td className="p-1"><input type="text" value={ritual.name} onChange={e => handleRitualChange(index, 'name', e.target.value)} className="bg-transparent w-full focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable} /></td>
                                            <td className="p-1"><input type="text" value={ritual.cost} onChange={e => handleRitualChange(index, 'cost', e.target.value)} className="bg-transparent w-16 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable} /></td>
                                            <td className="p-1"><input type="text" value={ritual.execution} onChange={e => handleRitualChange(index, 'execution', e.target.value)} className="bg-transparent w-20 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable} /></td>
                                            <td className="p-1"><input type="text" value={ritual.range} onChange={e => handleRitualChange(index, 'range', e.target.value)} className="bg-transparent w-16 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable} /></td>
                                            <td className="p-1"><input type="text" value={ritual.duration} onChange={e => handleRitualChange(index, 'duration', e.target.value)} className="bg-transparent w-20 focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable} /></td>
                                            <td className="p-1"><input type="text" value={ritual.description} onChange={e => handleRitualChange(index, 'description', e.target.value)} className="bg-transparent w-full focus:outline-none focus:bg-black/50 p-1 rounded-sm" disabled={isImmutable} /></td>
                                            <td className="p-1 text-center"><button onClick={() => !isImmutable && removeRitual(ritual.id)} className={`font-bold ${isImmutable ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-red-400'}`}>X</button></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={addRitual} className="mt-4 border border-gray-600 hover:bg-gray-800 px-4 py-1 text-sm transition-colors">Adicionar Ritual</button>
                </Section>
            </div>
            
            <DiceRoller 
                history={rollHistory}
                onManualRoll={handleManualRoll}
            />
            {isImageManagerOpen && (
                <ImageManager 
                    imageSet={character.imageSet}
                    onSave={handleImageSetSave}
                    onClose={() => setIsImageManagerOpen(false)}
                />
            )}
            {attributeRollResult && (
                <AttributeRollModal 
                    result={attributeRollResult}
                    onClose={() => setAttributeRollResult(null)}
                />
            )}
        </div>
    );
};

const getRoute = () => {
    const hash = window.location.hash || '#/';
    const [path, id] = hash.substring(2).split('/');
    return { path, id };
};

function App() {
    const [route, setRoute] = useState(getRoute());
    const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('isMasterLoggedIn') === 'true');

    const handleNavigation = useCallback((path: string) => {
        window.location.hash = path;
    }, []);

    useEffect(() => {
        const handleHashChange = () => setRoute(getRoute());
        window.addEventListener('hashchange', handleHashChange);
        
        if (window.location.hash === '' || window.location.hash === '#/') {
            window.location.hash = isLoggedIn ? '#/dashboard' : '#/login';
        }

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [isLoggedIn]);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        handleNavigation('#/dashboard');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isMasterLoggedIn');
        setIsLoggedIn(false);
        handleNavigation('#/login');
    };

    const renderContent = () => {
        const { path, id } = route;

        if (path === 'character' && id) {
            return <CharacterSheetPage characterId={id} onNavigate={handleNavigation} isMaster={isLoggedIn} />;
        }
        
        if (path === 'portrait' && id) {
            return <PortraitPage characterId={id} />;
        }

        if (isLoggedIn) {
            if (path === 'dashboard' || path === 'login' || path === '') {
                 return <DashboardPage onNavigate={handleNavigation} onLogout={handleLogout} />;
            }
        }
        
        // Default to login page if not logged in or route is unrecognized
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    };

    return <>{renderContent()}</>;
}

export default App;