const {
  TranslateClient,
  TranslateTextCommand,
} = require("@aws-sdk/client-translate");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

/**
 * Class to build api responses for our translation lambda.
 */
class ResponseGenerator {
  static internalServerError(e) {
    console.error(`InternalServerError: ${e}`);
    return {
      statusCode: 500,
      headers,
    };
  }

  static missingSourceLocale() {
    console.debug(
      "Bad request, a source locale was not provided in the request."
    );
    return {
      statusCode: 400,
      headers,
      body: "Invalid request, please provide a sourceLocale.",
    };
  }

  static missingTargetLocale() {
    console.debug(
      "Bad request, a target locale was not provided in the request."
    );
    return {
      statusCode: 400,
      headers,
      body: "Invalid request, please provide a targetLocale.",
    };
  }

  static missingSourceFile() {
    console.debug(
      "Bad request, a source file was not provided in the request."
    );
    return {
      statusCode: 400,
      headers,
      body: "Invalid request, please provide a sourceFile.",
    };
  }

  static success(response) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  }
}

/**
 * Class to make calls to aws translate
 */
class TranslateServiceClient {
  constructor() {
    this.translateClient = new TranslateClient();
  }

  /**
   * Translates a source string to a target language.
   * @param {string} source text to be translated
   * @param {string} translateTo language for the output
   * @returns {string} translated string
   */
  async translateText(source, translateFrom, translateTo) {
    const input = {
      Text: source,
      SourceLanguageCode: translateFrom,
      TargetLanguageCode: translateTo,
    };
    const command = new TranslateTextCommand(input);
    const response = await this.translateClient.send(command);
    console.log(`response received from translate service: ${response}`);
    return response.TranslatedText;
  }

  /**
   * Translates a react-intl json file from the sourceLocale to the targetLocale.
   * @param {JSON} sourceFile react-intl json file to be translated
   * @param {string} translateFrom locale of the sourceFile
   * @param {string} translateTo locale of the output file
   * @returns {JSON} output file with the messages translated to the targetLocale
   */
  async translateIntlFile(sourceFile, translateFrom, translateTo) {
    const outputFile = {};

    for (const [stringId, message] of Object.entries(sourceFile)) {
      const translatedMessage = await this.translateText(
        message,
        translateFrom,
        translateTo
      );
      outputFile[stringId] = translatedMessage;
    }

    return outputFile;
  }
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  console.log(
    `request to translate intl file lambda: \n ${JSON.stringify(body)}`
  );

  try {
    const { sourceFile, sourceLocale, targetLocale } = body;
    if (!sourceFile) return ResponseGenerator.missingSourceFile();
    if (!sourceLocale) return ResponseGenerator.missingSourceLocale();
    if (!targetLocale) return ResponseGenerator.missingTargetLocale();

    const translateServiceClient = new TranslateServiceClient();
    const response = await translateServiceClient.translateIntlFile(
      sourceFile,
      sourceLocale,
      targetLocale
    );

    // parse source text json, loop through keys/values, request translation and
    // replace value with newly translated string keeping stringId the same
    return ResponseGenerator.success(response);
  } catch (e) {
    return ResponseGenerator.internalServerError(e);
  }
};
