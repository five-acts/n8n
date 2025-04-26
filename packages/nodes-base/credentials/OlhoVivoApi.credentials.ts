import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OlhoVivoApi implements ICredentialType {
	name = 'OlhoVivoApi';
	displayName = 'API Olho Vivo SPTrans';
	documentationUrl =
		'https://www.sptrans.com.br/desenvolvedores/api-do-olho-vivo-guia-de-referencia/documentacao-api/';
	properties: INodeProperties[] = [
		{
			displayName: 'Token de Acesso',
			name: 'token',
			type: 'string',
			default: '',
			required: true,
			description: 'Token de acesso fornecido pela SPTrans',
		},
	];
}
