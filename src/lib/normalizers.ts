import { PositionCode, isValidPosition } from '../data/positions';

const POSITION_SYNONYMS: Record<string, PositionCode> = {
  'goalkeeper': 'GK',
  'keeper': 'GK',
  'goalie': 'GK',
  'gk': 'GK',

  'center back': 'CB',
  'centre back': 'CB',
  'centerback': 'CB',
  'centreback': 'CB',
  'center-back': 'CB',
  'centre-back': 'CB',
  'central defender': 'CB',
  'cb': 'CB',

  'left back': 'LB',
  'leftback': 'LB',
  'left-back': 'LB',
  'lb': 'LB',

  'right back': 'RB',
  'rightback': 'RB',
  'right-back': 'RB',
  'rb': 'RB',

  'left wing back': 'LWB',
  'left wingback': 'LWB',
  'left wing-back': 'LWB',
  'lwb': 'LWB',

  'right wing back': 'RWB',
  'right wingback': 'RWB',
  'right wing-back': 'RWB',
  'rwb': 'RWB',

  'defensive midfielder': 'CDM',
  'defensive mid': 'CDM',
  'holding midfielder': 'CDM',
  'holding mid': 'CDM',
  'central defensive midfielder': 'CDM',
  'cdm': 'CDM',
  'dm': 'CDM',

  'central midfielder': 'CM',
  'center midfielder': 'CM',
  'centre midfielder': 'CM',
  'central mid': 'CM',
  'center mid': 'CM',
  'centre mid': 'CM',
  'midfielder': 'CM',
  'cm': 'CM',

  'attacking midfielder': 'CAM',
  'attacking mid': 'CAM',
  'central attacking midfielder': 'CAM',
  'center attacking mid': 'CAM',
  'centre attacking mid': 'CAM',
  'number 10': 'CAM',
  'no 10': 'CAM',
  'cam': 'CAM',
  'am': 'CAM',

  'left midfielder': 'LM',
  'left mid': 'LM',
  'left midfield': 'LM',
  'lm': 'LM',

  'right midfielder': 'RM',
  'right mid': 'RM',
  'right midfield': 'RM',
  'rm': 'RM',

  'left attacking midfielder': 'LAM',
  'left attacking mid': 'LAM',
  'lam': 'LAM',

  'right attacking midfielder': 'RAM',
  'right attacking mid': 'RAM',
  'ram': 'RAM',

  'left winger': 'LW',
  'left wing': 'LW',
  'lw': 'LW',

  'right winger': 'RW',
  'right wing': 'RW',
  'rw': 'RW',

  'left forward': 'LF',
  'lf': 'LF',

  'right forward': 'RF',
  'rf': 'RF',

  'center forward': 'CF',
  'centre forward': 'CF',
  'cf': 'CF',

  'striker': 'ST',
  'forward': 'ST',
  'attacker': 'ST',
  'st': 'ST',
  'fw': 'ST'
};

export function normalizePosition(input: string | undefined | null): PositionCode | null {
  if (!input) return null;

  const cleaned = input.trim().toLowerCase();

  if (!cleaned) return null;

  if (isValidPosition(cleaned.toUpperCase())) {
    return cleaned.toUpperCase() as PositionCode;
  }

  if (cleaned in POSITION_SYNONYMS) {
    return POSITION_SYNONYMS[cleaned];
  }

  return null;
}

export function normalizePositionOrDefault(
  input: string | undefined | null,
  defaultValue: PositionCode | '' = ''
): PositionCode | '' {
  const normalized = normalizePosition(input);
  return normalized ?? defaultValue;
}
