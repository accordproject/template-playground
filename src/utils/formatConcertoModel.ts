import { Parser, Printer } from "@accordproject/concerto-cto";

export function formatConcertoModel(cto: string): string {
  const ast = Parser.parse(cto);
  return Printer.toCTO(ast);
}

