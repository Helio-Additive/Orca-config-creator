export enum ConfigOptionType {
  coVectorType = 0x4000,
  coNone = 0,
  // single float
  coFloat = 1,
  // vector of floats
  coFloats = coFloat + coVectorType,
  // single int
  coInt = 2,
  // vector of ints
  coInts = coInt + coVectorType,
  // single string
  coString = 3,
  // vector of strings
  coStrings = coString + coVectorType,
  // percent value. Currently only used for infill.
  coPercent = 4,
  // percents value. Currently used for retract before wipe only.
  coPercents = coPercent + coVectorType,
  // a fraction or an absolute value
  coFloatOrPercent = 5,
  // vector of the above
  coFloatsOrPercents = coFloatOrPercent + coVectorType,
  // single 2d point (Point2f). Currently not used.
  coPoint = 6,
  // vector of 2d points (Point2f). Currently used for the definition of the print bed and for the extruder offsets.
  coPoints = coPoint + coVectorType,
  coPoint3 = 7,
  //    coPoint3s       = coPoint3 + coVectorType,
  // single boolean value
  coBool = 8,
  // vector of boolean values
  coBools = coBool + coVectorType,
  // a generic enum
  coEnum = 9,
  // BBS: vector of enums
  coEnums = coEnum + coVectorType,
}

export function isVector(a: ConfigOptionType) {
  return a >= ConfigOptionType.coVectorType;
}

function getNonVectorType(a: ConfigOptionType) {
  if (isVector(a)) return a - ConfigOptionType.coVectorType;
  else return a;
}

export enum ConfigOptionMode {
  comSimple = 0,
  comAdvanced,
  comDevelop,
}

export const configOptionTypeToInputTypeString = (a: ConfigOptionType) => {
  switch (getNonVectorType(a)) {
    case ConfigOptionType.coEnum:
      return "dropdown";
    case ConfigOptionType.coBool:
      return "boolean";
    case ConfigOptionType.coInt:
    case ConfigOptionType.coFloat:
      return "number";
    default:
      return "text";
  }
};
