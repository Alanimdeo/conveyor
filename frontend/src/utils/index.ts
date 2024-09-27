import type { CustomParameter } from "@conveyor/types";

export function canSaveCustomParameters(parameters: CustomParameter[]) {
  const keys = parameters.map((p) => p.key);
  const result = parameters.every(
    (parameter, index) =>
      parameter.key !== "" &&
      parameter.label !== "" &&
      keys.lastIndexOf(parameter.key) == index
  );
  return result;
}

export function replace(string: string, key: string, replaceValue: string) {
  return string.replace(new RegExp(`{{${key}}}`, "g"), replaceValue);
}
