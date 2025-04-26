import type { IExecuteFunctions, IHookFunctions, IDataObject, NodeApiError } from 'n8n-workflow';
import type { OptionsWithUri } from 'request';

/**
 * Realiza uma requisição à API do Olho Vivo
 */
export async function olhoVivoApiRequest(
	this: IHookFunctions | IExecuteFunctions,
	method: string,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
) {
	const credentials = await this.getCredentials('OlhoVivoApi');
	const token = credentials.token as string;

	// 1. Primeiro, fazer a autenticação
	const authOptions = {
		method: 'POST',
		uri: `https://api.olhovivo.sptrans.com.br/v2.1/Login/Autenticar?token=${token}`,
		json: true,
		resolveWithFullResponse: true,
	};

	try {
		// Fazer a requisição de autenticação
		const authResponse = await this.helpers.request!(authOptions);

		// Verificar se a autenticação foi bem-sucedida
		if (authResponse.body !== true) {
			throw new Error('Falha na autenticação. Verifique o token fornecido.');
		}

		// Capturar cookies da resposta
		const cookies = authResponse.headers['set-cookie'];

		if (!cookies || cookies.length === 0) {
			throw new Error('Não foi possível obter cookies de autenticação da API.');
		}

		// 2. Fazer a requisição desejada com os cookies da autenticação
		const options: OptionsWithUri = {
			method,
			uri: `https://api.olhovivo.sptrans.com.br/v2.1${endpoint}`,
			json: true,
			headers: {
				Cookie: cookies,
			},
			qs: query,
			body,
		};

		// Registrar a requisição que será feita
		console.log(`Fazendo requisição ${method} para ${options.uri}`);

		try {
			const response = await this.helpers.request!(options);
			return response;
		} catch (error) {
			console.error('Erro na requisição de dados:', error.message);
			// Se houver erro na requisição de dados, retornamos informações úteis para diagnóstico
			return {
				erro: 'Erro na requisição de dados',
				mensagem: error.message,
				endpoint,
				parametros: query,
			};
		}
	} catch (error) {
		console.error('Erro na autenticação:', error.message);
		// Se houver erro na autenticação, retornamos informações úteis para diagnóstico
		return {
			erro: 'Erro na autenticação',
			mensagem: error.message,
			token: `${token.substring(0, 3)}...${token.substring(token.length - 3)}`, // Mostra apenas parte do token por segurança
		};
	}
}

/**
 * Processa os dados da linha retornados pela API
 */
export function processarLinhaResponse(linha: IDataObject) {
	return {
		codigo_linha: linha.cl,
		circular: linha.lc,
		letreiro: linha.lt,
		tipo_linha: linha.tl,
		sentido: linha.sl,
		terminal_principal: linha.tp,
		terminal_secundario: linha.ts,
	};
}
