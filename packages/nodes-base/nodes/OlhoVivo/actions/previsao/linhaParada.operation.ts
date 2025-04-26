import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';

import { olhoVivoApiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Codigo da Parada',
		name: 'codigoParada',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['previsao'],
				operation: ['linhaParada'],
			},
		},
		description: 'Codigo identificador da parada de onibus',
		placeholder: '4200953',
	},
	{
		displayName: 'Codigo da Linha',
		name: 'codigoLinha',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['previsao'],
				operation: ['linhaParada'],
			},
		},
		description: 'Codigo identificador da linha de onibus',
		placeholder: '1989',
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject[]> {
	// Obter os valores dos parâmetros com verificação explícita
	let codigoParada: string = '';
	let codigoLinha: string = '';

	try {
		codigoParada = this.getNodeParameter('codigoParada', i) as string;
	} catch (error) {
		console.error('Erro ao obter codigoParada:', error.message);
		// Tentar obter do item JSON diretamente
		const item = this.getInputData()[i];
		if (item && item.json && item.json.codigoParada) {
			codigoParada = item.json.codigoParada as string;
			console.log(`Obtido codigoParada do JSON: ${codigoParada}`);
		} else if (item && item.json && item.json.C_digo_da_Parada) {
			codigoParada = item.json.C_digo_da_Parada as string;
			console.log(`Obtido codigoParada do JSON (format alternativo): ${codigoParada}`);
		}
	}

	try {
		codigoLinha = this.getNodeParameter('codigoLinha', i) as string;
	} catch (error) {
		console.error('Erro ao obter codigoLinha:', error.message);
		// Tentar obter do item JSON diretamente
		const item = this.getInputData()[i];
		if (item && item.json && item.json.codigoLinha) {
			codigoLinha = item.json.codigoLinha as string;
			console.log(`Obtido codigoLinha do JSON: ${codigoLinha}`);
		} else if (item && item.json && item.json.C_digo_da_Linha) {
			codigoLinha = item.json.C_digo_da_Linha as string;
			console.log(`Obtido codigoLinha do JSON (format alternativo): ${codigoLinha}`);
		}
	}

	// Verificar se os parâmetros estão definidos
	if (!codigoParada || !codigoLinha) {
		return [
			{
				erro: 'Parâmetros obrigatórios ausentes',
				codigo_parada: codigoParada || 'Não fornecido',
				codigo_linha: codigoLinha || 'Não fornecido',
			},
		];
	}

	console.log(
		`Executando operação linhaParada com codigoParada=${codigoParada}, codigoLinha=${codigoLinha}`,
	);

	// Fazer a requisição para obter a previsão de chegada para linha e parada específicas
	const endpoint = `/Previsao?codigoParada=${encodeURIComponent(codigoParada)}&codigoLinha=${encodeURIComponent(codigoLinha)}`;

	// Fazer a chamada à API e capturar a resposta completa para análise
	const response = await olhoVivoApiRequest.call(this, 'GET', endpoint);

	// Processar os dados de resposta
	const returnData: IDataObject[] = [];

	// Verificar a estrutura completa da resposta para diagnóstico
	if (!response) {
		// Adiciona um item informando que a resposta foi vazia
		returnData.push({
			erro: 'Resposta vazia da API',
			codigo_parada: codigoParada,
			codigo_linha: codigoLinha,
		});
		return returnData;
	}

	// Se temos uma resposta, mas não temos o campo p, retornamos a resposta bruta para diagnóstico
	if (!response.p) {
		returnData.push({
			resposta_api: response,
			codigo_parada_usado: codigoParada,
			codigo_linha_usado: codigoLinha,
		});
		return returnData;
	}

	// Processamento normal da resposta
	const parada = response.p;

	// Dados básicos da parada
	const paradaInfo: IDataObject = {
		codigo_parada: parada.cp,
		nome_parada: parada.np,
		latitude: parada.py,
		longitude: parada.px,
		hora_atualizacao: response.hr,
	};

	// Processar as linhas e previsões
	if (Array.isArray(parada.l)) {
		for (const linha of parada.l) {
			const linhaInfo: IDataObject = {
				...paradaInfo,
				codigo_linha: linha.cl,
				letreiro_codigo: linha.c,
				sentido: linha.sl,
				letreiro_origem: linha.lt0,
				letreiro_destino: linha.lt1,
				qtd_veiculos: linha.qv,
			};

			// Adicionar veículos com previsão
			if (Array.isArray(linha.vs)) {
				for (const veiculo of linha.vs) {
					returnData.push({
						...linhaInfo,
						prefixo_veiculo: veiculo.p,
						acessivel: veiculo.a === true,
						previsao_chegada: veiculo.t,
						latitude_veiculo: veiculo.py,
						longitude_veiculo: veiculo.px,
					});
				}
			} else {
				// Se não há veículos previstos, retorna apenas as informações da linha
				returnData.push({
					...linhaInfo,
					sem_previsao: true,
				});
			}
		}
	} else if (parada.l) {
		// Em alguns casos, l pode não ser um array
		returnData.push({
			...paradaInfo,
			dados_linha: parada.l,
			observacao: 'Estrutura de linha não reconhecida',
		});
	} else {
		// Não há linhas na resposta
		returnData.push({
			...paradaInfo,
			sem_linhas: true,
		});
	}

	return returnData;
}
