/**
 * @fileoverview Manager for the Box Metadata Resource
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import BoxClient from '../box-client';
import urlPath from '../util/url-path';
const merge = require('merge-options');

// -----------------------------------------------------------------------------
// Typedefs
// -----------------------------------------------------------------------------

/**
 * Valid metadata field types
 * @readonly
 * @enum {MetadataFieldType}
 */
enum MetadataFieldType {
	STRING = 'string',
	ENUM = 'enum',
	NUMBER = 'float',
	DATE = 'date',
	MULTI_SELECT = 'multiSelect',
}

/**
 * Metadata enum option
 * @typedef {Object} MetadataEnumOption
 * @property {string} key The option value
 */
type MetadataEnumOption = {
	key: string;
};

/**
 * Field definition for a metadata template
 * @typedef {Object} MetadataTemplateField
 * @property {MetadataFieldType} type The type of the field
 * @property {string} key The programmatic name of the field
 * @property {string} displayName The display name of the field
 * @property {MetadataEnumOption[]} [options] For enum fields, the options
 */
type MetadataTemplateField = {
	type: MetadataFieldType;
	key: string;
	displayName: string;
	options?: MetadataEnumOption[];
};

// -----------------------------------------------------------------------------
// Private
// -----------------------------------------------------------------------------
const PROPERTIES_TEMPLATE = 'properties',
	BASE_PATH = '/metadata_templates',
	SCHEMA_SUBRESOURCE = 'schema',
	ENTERPRISE_SCOPE = 'enterprise',
	GLOBAL_SCOPE = 'global',
	CASCADE_POLICIES_PATH = '/metadata_cascade_policies',
	QUERY_PATH = '/metadata_queries/execute_read';

// -----------------------------------------------------------------------------
// Public
// -----------------------------------------------------------------------------

/**
 * Simple manager for interacting with all metadata endpoints and actions.
 *
 * @constructor
 * @param {BoxClient} client - The Box API Client that is responsible for making calls to the API
 * @returns {void}
 */
class Metadata {
	client: BoxClient;

	templates!: Record<string, any>;
	scopes!: Record<string, any>;
	cascadeResolution!: Record<string, any>;
	fieldTypes!: typeof MetadataFieldType;

	constructor(client: BoxClient) {
		this.client = client;
	}

	/**
	 * Retrieve the schema definition for a metadata template
	 *
	 * API Endpoint: '/metadata_templates/:scope/:template'
	 * Method: GET
	 *
	 * @param {string} scope - The scope of the template, e.g. "enterprise"
	 * @param {string} template - The template to retrieve
	 * @param {Function} [callback] - Called with the template schema if successful
	 * @returns {Promise<Object>} A promise resolving to the template schema
	 */
	getTemplateSchema(scope: string, template: string, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, scope, template, SCHEMA_SUBRESOURCE);
		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * Retrieve the schema definition for a metadata template by ID
	 *
	 * API Endpoint: '/metadata_templates/:id'
	 * Method: GET
	 *
	 * @param {string} templateID - The ID of the template to retrieve
	 * @param {Function} [callback] - Called with the template schema if successful
	 * @returns {Promise<Object>} A promise resolving to the template schema
	 */
	getTemplateByID(templateID: string, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, templateID);
		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * Get all templates in a given scope
	 *
	 * API Endpoint: '/metadata_templates/:scope'
	 * Method: GET
	 *
	 * @param {string} scope - The scope to retrieve templates for
	 * @param {Function} [callback] - Called with an array of templates when successful
	 * @returns {Promise<Object>} A promise resolving to the collection of templates
	 */
	getTemplates(scope: string, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, scope);
		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * Create a new metadata template
	 *
	 * API Endpoint: '/metadata_templates/schema',
	 * Method: POST
	 *
	 * @param {string} templateName - The name of the metadata template
	 * @param {MetadataTemplateField[]} fields - A list of fields for the template
	 * @param {Object} [options] - Optional parameters, can be left null in many cases
	 * @param {string} [options.templateKey] - The programmatic key for the template
	 * @param {boolean} [options.hidden] - Whether the template should be hidden in the UI
	 * @param {string} [options.scope=enterprise] - The scope for the template, only 'enterprise' is supported for now
	 * @param {boolean} [options.copyInstanceOnItemCopy] - Whether to include the metadata when a file or folder is copied
	 * @param {Function} [callback] - Passed the template if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the created template
	 */
	createTemplate(
		templateName: string,
		fields: MetadataTemplateField[],
		options?: {
			templateKey?: string;
			hidden?: boolean;
			scope?: string;
			copyInstanceOnItemCopy?: boolean;
		},
		callback?: Function
	) {
		var apiPath = urlPath(BASE_PATH, SCHEMA_SUBRESOURCE),
			params = {
				body: {
					scope: ENTERPRISE_SCOPE,
					displayName: templateName,
					fields,
				},
			};

		Object.assign(params.body, options);

		return this.client.wrapWithDefaultHandler(this.client.post)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Update a metadata template via one or more non-breaking operations.  Each
	 * operation is a an object descrbing one change to the template or its
	 * fields.
	 *
	 * API Endpoint: '/metadata_templates/:scope/:template/schema'
	 * Method: PUT
	 *
	 * @param {string} scope - The scope of the template to modify
	 * @param {string} template - The template to modify
	 * @param {Object[]} operations - The operations to perform
	 * @param {Function} [callback] - Passed the updated template if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the updated template
	 * @see {@link https://developer.box.com/en/reference/put-metadata-templates-id-id-schema/}
	 */
	updateTemplate(
		scope: string,
		template: string,
		operations: Record<string, any>[],
		callback?: Function
	) {
		var apiPath = urlPath(BASE_PATH, scope, template, SCHEMA_SUBRESOURCE),
			params = {
				body: operations,
			};

		return this.client.wrapWithDefaultHandler(this.client.put)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Delete a metadata template from an enterprise.
	 *
	 * API Endpoint: '/metadata_templates/:scope/:template/schema'
	 * Method: DELETE
	 *
	 * @param {string} scope - The scope of the template to delete
	 * @param {string} template - The template to delete
	 * @param {Function} [callback] - Passed empty response body if successful, err otherwise
	 * @returns {Promise<void>} A promise resolving to nothing
	 * @see {@link https://developer.box.com/en/reference/delete-metadata-templates-id-id-schema/}
	 */
	deleteTemplate(scope: string, template: string, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, scope, template, SCHEMA_SUBRESOURCE);
		return this.client.wrapWithDefaultHandler(this.client.del)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * Get the cascade policies associated with a given folder.
	 *
	 * API Endpoint: '/metadata_cascade_policies'
	 * Method: GET
	 *
	 * @param {string} folderID The ID of the folder to get cascade policies for
	 * @param {Object} [options] Optional parameters
	 * @param {string} [options.owner_enterprise_id] ID of the enterprise to get policies for
	 * @param {Function} [callback] Passed the collection of policies if successful
	 * @returns {Promise<Object>} Promise resolving to the collection of policies
	 */
	getCascadePolicies(
		folderID: string,
		options?: {
			owner_enterprise_id?: string;
		},
		callback?: Function
	) {
		var apiPath = urlPath(CASCADE_POLICIES_PATH),
			params = {
				qs: Object.assign({ folder_id: folderID }, options),
			};

		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Get a metadata cascade policy object by ID
	 *
	 * API Endpoint: '/metadata_cascade_policies/:policyID'
	 * Method: GET
	 *
	 * @param {string} policyID The ID of the policy to retrieve
	 * @param {Function} [callback] Passed the cascade policy if successful
	 * @returns {Promise<Object>} Promise resolving to the cascade policy
	 */
	getCascadePolicy(policyID: string, callback?: Function) {
		var apiPath = urlPath(CASCADE_POLICIES_PATH, policyID);

		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * Add a new cascade policy to a folder/metadata template, causing the
	 * metadata template to be applied to all items and subfolders inside the
	 * folder.
	 *
	 * API Endpoint: '/metadata_cascade_policies'
	 * Method: POST
	 *
	 * @param {string} scope Metadata template scope for the template to cascade
	 * @param {string} templateKey Metadata template key for the template to cascade
	 * @param {string} folderID The ID of the folder to cascade over
	 * @param {Function} [callback] Passed the cascade policy if successful
	 * @returns {Promise<Object>} Promise resolving to the cascade policy
	 */
	createCascadePolicy(
		scope: string,
		templateKey: string,
		folderID: string,
		callback?: Function
	) {
		var apiPath = urlPath(CASCADE_POLICIES_PATH),
			params = {
				body: {
					folder_id: folderID,
					scope,
					templateKey,
				},
			};

		return this.client.wrapWithDefaultHandler(this.client.post)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Delete the metadata cascade policy with the given ID
	 *
	 * API Endpoint: '/metadata_cascade_policies/:policyID'
	 * Method: DELETE
	 *
	 * @param {string} policyID The ID of the policy to delete
	 * @param {Function} [callback] Passed nothing if successful
	 * @returns {Promise<void>} Promise resolving to nothing
	 */
	deleteCascadePolicy(policyID: string, callback?: Function) {
		var apiPath = urlPath(CASCADE_POLICIES_PATH, policyID);
		return this.client.wrapWithDefaultHandler(this.client.del)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * If a policy already exists on a folder, this will apply that policy to all existing files and
	 * sub-folders within the target folder.
	 *
	 * API Endpoint: '/metadata_cascade_policies/:policyID/apply'
	 * Method: POST
	 *
	 * @param {string} policyID The ID of the policy to delete
	 * @param {string} resolutionMethod How to resolve conflicts, either "none" or "overwrite"
	 * @param {Function} [callback] Passed nothing if successful
	 * @returns {Promise<void>} Promise resolving to nothing
	 */
	forceApplyCascadePolicy(
		policyID: string,
		resolutionMethod: string,
		callback?: Function
	) {
		var apiPath = urlPath(CASCADE_POLICIES_PATH, policyID, 'apply'),
			params = {
				body: {
					conflict_resolution: resolutionMethod,
				},
			};

		return this.client.wrapWithDefaultHandler(this.client.post)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Query Box items by their metadata.
	 * We no longer require the index_name/use_index for queries that leverage indexes,
     * internal analysis engine determines which existing index will satisfy the query.
	 *
	 * API Endpoint: '/metadata_queries/execute_read'
	 * Method: POST
	 *
	 * @param {string} from - The template used in the query. Must be in the form scope.templateKey
	 * @param {string} ancestorFolderId - The folder_id to which to restrain the query
	 * @param {Object} [options] - Optional parameters
	 * @param {string} [options.query] - The logical expression of the query
	 * @param {Object} [options.query_parameters] - Required if query present. The arguments for the query
	 * @param {string} [options.index_name] - DEPRECATED: This parameter is ignored. The name of the index to use
	 * @param {Object} [options.order_by] - The field_key(s) to order on and the corresponding direction(s)
	 * @param {Array} [options.fields] - An array of fields to return
	 * @param {Function} [callback] - Passed a collection of items and their associated metadata
	 * @returns {Promise<void>} Promise resolving to a collection of items and their associated metadata
	 */
	query(
		from: string,
		ancestorFolderId: string,
		options?: {
			query?: string;
			query_parameters?: Record<string, any>;
			index_name?: string;
			order_by: Record<string, any>;
			fields?: string[];
		},
		callback?: Function
	) {
		var body = {
			from,
			ancestor_folder_id: ancestorFolderId,
		};

		const { index_name: indexName, ...newOptions } = options ?? {};

		var params = {
			body: merge(body, newOptions),
		};

		return this.client.wrapWithDefaultHandler(this.client.post)(
			QUERY_PATH,
			params,
			callback
		);
	}
}

Metadata.prototype.templates = {
	PROPERTIES: PROPERTIES_TEMPLATE,
};

Metadata.prototype.scopes = {
	ENTERPRISE: ENTERPRISE_SCOPE,
	GLOBAL: GLOBAL_SCOPE,
};

Metadata.prototype.cascadeResolution = Object.freeze({
	PRESERVE_EXISTING: 'none',
	OVERWRITE: 'overwrite',
});

/**
 * Valid metadata field types
 * @readonly
 * @enum {MetadataFieldType}
 */
Metadata.prototype.fieldTypes = MetadataFieldType;

export = Metadata;
