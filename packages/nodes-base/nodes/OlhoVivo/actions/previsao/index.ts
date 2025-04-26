import type { INodeProperties } from 'n8n-workflow';

import * as parada from './parada.operation';
import * as linha from './linha.operation';
import * as linhaParada from './linhaParada.operation';

export const previsaoOperations: INodeProperties[] = [
	{
		displayName: 'Operacao',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['previsao'],
			},
		},
		options: [
			{
				name: 'Parada',
				value: 'parada',
				description: 'Retorna a previsao de chegada dos veiculos para uma determinada parada',
				action: 'Consultar previsoes de chegada por parada',
			},
			{
				name: 'Linha',
				value: 'linha',
				description:
					'Retorna a previsao de chegada de cada um dos veiculos da linha informada em todos os pontos de parada',
				action: 'Consultar previsoes de chegada de uma linha em todas as paradas',
			},
			{
				name: 'Linha e Parada',
				value: 'linhaParada',
				description:
					'Retorna a previsao de chegada dos veiculos da linha informada que atende ao ponto de parada informado',
				action: 'Consultar previsoes de chegada por linha e parada',
			},
		],
		default: 'parada',
	},
];

export const description = [
	...parada.description,
	...linha.description,
	...linhaParada.description,
];

export const execute = {
	parada: parada.execute,
	linha: linha.execute,
	linhaParada: linhaParada.execute,
};
