#!/usr/bin/env node

const dotenv = require('dotenv').config({
  path: `${__dirname}/.swagger_vars.env`
});
const fs = require('fs');
const path = require('path');
const cli = require('cli');
const yaml = require('js-yaml');
const substitute = require('shellsubstitute');

const OUTPUT_FILE_WITH_ENV_VARS = 'swagger-with-vars.yml';

const options = cli.parse({
  file: ['f', 'The YAML definition file', 'file'],
  lang: ['l', 'The target language of the client library', 'string'],
  output: ['o', 'The output path for the client library', 'string']
});

cli.spinner('Working...');

const swaggerConfig = yaml.safeLoad(fs.readFileSync(path.join(__dirname, options.file), 'utf-8'));
const JSONconfigWithEnvVars = substitute(JSON.stringify(swaggerConfig, null, 2), process.env);
const swaggerConfigWithEnvVars = yaml.safeDump(JSON.parse(JSONconfigWithEnvVars));
fs.writeFileSync(`./${OUTPUT_FILE_WITH_ENV_VARS}`, swaggerConfigWithEnvVars);

const success = () => {
  cli.spinner('Working... done!', true);
  cli.ok(`Finished generating client library: ${options.output}`);
}

/**
 * This is the error callback. Whenever an error occurs, this function is called.
 * The reason success is called at the end is because the Java cli tool — swagger-codegen —
 * dumps everything to stderr which tricks cli.js into thinking the command has failed.
 *
 * @see https://github.com/node-js-libs/cli/blob/master/cli.js#L1018
 *
 * @param error
 * @param stdout
 */
const error = (error, stdout) => {
  if (error instanceof Error) {
    cli.spinner('Working... not...!', true);
    cli.fatal(error);
  }

  //! Called because Java!
  success();
}

cli.exec(`swagger-codegen generate -i ${OUTPUT_FILE_WITH_ENV_VARS} -l ${options.lang} -o ${options.output}`, success, error);
