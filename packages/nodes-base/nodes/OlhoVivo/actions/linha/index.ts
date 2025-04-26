import type { INodeProperties } from 'n8n-workflow';
import * as buscar from './buscar.operation';
import * as buscarSentido from './buscarSentido.operation';

export const linhaOperations: INodeProperties[] = [
	{
		displayName: 'Operação',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['linha'],
			},
		},
		options: [
			{
				name: 'Buscar',
				value: 'buscar',
				description: 'Buscar linhas de onibus pelo numero ou nome',
				action: 'Buscar linhas de onibus por texto',
			},
			{
				name: 'Buscar por Sentido',
				value: 'buscarSentido',
				description: 'Buscar todas as variacoes de uma linha de onibus por codigo',
				action: 'Buscar variacoes de uma linha de onibus',
			},
		],
		default: 'buscar',
	},
];

export const description = [...buscar.description, ...buscarSentido.description];

export const execute = {
	buscar: buscar.execute,
	buscarSentido: buscarSentido.execute,
};
