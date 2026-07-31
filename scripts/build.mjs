import ts from 'typescript';
import { runVite } from './vite-runner.mjs';

const formatHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

const reportDiagnostic = (diagnostic) => {
  console.error(ts.formatDiagnostic(diagnostic, formatHost));
};

const host = ts.createSolutionBuilderHost(
  ts.sys,
  undefined,
  reportDiagnostic,
);
const builder = ts.createSolutionBuilder(host, ['tsconfig.json'], {});
const buildStatus = builder.build();

if (buildStatus !== ts.ExitStatus.Success) {
  process.exit(buildStatus);
}

await runVite('build');
