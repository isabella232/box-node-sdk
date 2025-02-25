/**
 * @fileoverview Manager for the Groups resource
 * @author mwiller
 */

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

import BoxClient from '../box-client';
import urlPath from '../util/url-path';

// -----------------------------------------------------------------------------
// Typedefs
// -----------------------------------------------------------------------------

/**
 * Enum of valid access levels for groups, which are used to specify who can
 * perform certain actions on the group.
 * @enum {GroupAccessLevel}
 */
enum GroupAccessLevel {
	ADMINS = 'admins_only',
	MEMBERS = 'admins_and_members',
	ALL_USERS = 'all_managed_users',
}

/**
 * Enum of valid user roles within a group
 * @enum {GroupUserRole}
 */
enum GroupUserRole {
	MEMBER = 'member',
	ADMIN = 'admin',
}

// -----------------------------------------------------------------------------
// Private
// -----------------------------------------------------------------------------

const BASE_PATH = '/groups',
	MEMBERSHIPS_PATH = '/group_memberships',
	MEMBERSHIPS_SUBRESOURCE = 'memberships',
	COLLABORATIONS_SUBRESOURCE = 'collaborations';

// -----------------------------------------------------------------------------
// Public
// -----------------------------------------------------------------------------

/**
 * Simple manager for interacting with all 'Groups' endpoints and actions.
 *
 * @constructor
 * @param {BoxClient} client - The Box API Client that is responsible for making calls to the API
 * @returns {void}
 */
class Groups {
	client: BoxClient;
	accessLevels!: typeof GroupAccessLevel;
	userRoles!: typeof GroupUserRole;

	constructor(client: BoxClient) {
		this.client = client;
	}

	/**
	 * Used to create a new group
	 *
	 * API Endpoint: '/groups'
	 * Method: POST
	 *
	 * @param {string} name - The name for the new group
	 * @param {Object} [options] - Additional parameters
	 * @param {string} [options.provenance] - Used to track the external source where the group is coming from
	 * @param {string} [options.external_sync_identifier] - Used as a group identifier for groups coming from an external source
	 * @param {string} [options.description] - Description of the group
	 * @param {GroupAccessLevel} [options.invitability_level] - Specifies who can invite this group to collaborate on folders
	 * @param {GroupAccessLevel} [options.member_viewability_level] - Specifies who can view the members of this group
	 * @param {Function} [callback] - Passed the new group object if it was created successfully, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the new group object
	 */
	create(
		name: string,
		options?: {
			provenance?: string;
			external_sync_identifier?: string;
			description?: string;
			invitability_level?: GroupAccessLevel;
			member_viewability_level?: GroupAccessLevel;
		},
		callback?: Function
	) {
		var apiPath = urlPath(BASE_PATH),
			params: Record<string, any> = {
				body: options || {},
			};

		params.body.name = name;

		return this.client.wrapWithDefaultHandler(this.client.post)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Used to fetch information about a group
	 *
	 * API Endpoint: '/groups/:groupID'
	 * Method: GET
	 *
	 * @param {string} groupID - The ID of the group to retrieve
	 * @param {Object} [options] - Additional options for the request. Can be left null in most cases.
	 * @param {Function} [callback] - Passed the group object if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the group object
	 */
	get(groupID: string, options?: Record<string, any>, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, groupID),
			params = {
				qs: options,
			};

		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Used to update or modify a group object
	 *
	 * API Endpoint: '/groups/:groupID'
	 * Method: PUT
	 *
	 * @param {string} groupID - The ID of the group to update
	 * @param {Object} updates - Group fields to update
	 * @param {Function} [callback] - Passed the updated group object if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the updated group object
	 */
	update(groupID: string, updates?: Record<string, any>, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, groupID),
			params = {
				body: updates,
			};

		return this.client.wrapWithDefaultHandler(this.client.put)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Delete a group
	 *
	 * API Endpoint: '/groups/:groupID'
	 * Method: DELETE
	 *
	 * @param {string} groupID - The ID of the group to delete
	 * @param {Function} [callback] - Passed nothing if successful, error otherwise
	 * @returns {Promise<void>} A promise resolving to nothing
	 */
	delete(groupID: string, callback?: Function) {
		var apiPath = urlPath(BASE_PATH, groupID);

		return this.client.wrapWithDefaultHandler(this.client.del)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * Add a user to a group, which creates a membership record for the user
	 *
	 * API Endpoint: '/group_memberships'
	 * Method: POST
	 *
	 * @param {string} groupID - The ID of the group to add the user to
	 * @param {string} userID - The ID of the user to add the the group
	 * @param {Object} [options] - Optional parameters for adding the user, can be left null in most cases
	 * @param {GroupUserRole} [options.role] - The role of the user in the group
	 * @param {Function} [callback] - Passed the membership record if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the new membership object
	 */
	addUser(
		groupID: string,
		userID: string,
		options?: {
			role?: GroupUserRole;
		},
		callback?: Function
	) {
		var apiPath = urlPath(MEMBERSHIPS_PATH),
			params = {
				body: {
					user: {
						id: userID,
					},
					group: {
						id: groupID,
					},
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
	 * Fetch a specific membership record, which shows that a given user is a member
	 * of some group.
	 *
	 * API Endpoint: '/group_memberships/:membershipID'
	 * Method: GET
	 *
	 * @param {string} membershipID - The ID of the membership to fetch
	 * @param {Object} [options] - Additional options for the request. Can be left null in most cases.
	 * @param {Function} [callback] - Passed the membership record if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the membership object
	 */
	getMembership(
		membershipID: string,
		options?: Record<string, any>,
		callback?: Function
	) {
		var apiPath = urlPath(MEMBERSHIPS_PATH, membershipID),
			params = {
				qs: options,
			};

		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Used to update or modify a group object
	 *
	 * API Endpoint: '/group_memberships/:membershipID'
	 * Method: PUT
	 *
	 * @param {string} membershipID - The ID of the membership to update
	 * @param {Object} options - Membership record fields to update
	 * @param {Function} [callback] - Passed the updated membership object if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the updated membership object
	 */
	updateMembership(
		membershipID: string,
		options: Record<string, any>,
		callback?: Function
	) {
		var apiPath = urlPath(MEMBERSHIPS_PATH, membershipID),
			params = {
				body: options,
			};

		return this.client.wrapWithDefaultHandler(this.client.put)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Used to remove a group membership
	 *
	 * API Endpoint: '/group_memberships/:membershipID'
	 * Method: DELETE
	 *
	 * @param {string} membershipID - The ID of the membership to be removed
	 * @param {Function} [callback] - Passed nothing if successful, error otherwise
	 * @returns {Promise<void>} A promise resolving to nothing
	 */
	removeMembership(membershipID: string, callback?: Function) {
		var apiPath = urlPath(MEMBERSHIPS_PATH, membershipID);

		return this.client.wrapWithDefaultHandler(this.client.del)(
			apiPath,
			null,
			callback
		);
	}

	/**
	 * Retreieve a list of memberships for the group, which show which users
	 * belong to the group
	 *
	 * API Endpoint: '/groups/:groupID/memberships'
	 * Method: GET
	 *
	 * @param {string} groupID - The ID of the group to get memberships for
	 * @param {Object} [options] - Optional parameters, can be left null in most cases
	 * @param {int} [options.limit] - The number of memberships to retrieve
	 * @param {int} [options.offset] - Paging marker, retrieve records starting at this position in the list
	 * @param {Function} [callback] - Passed a list of memberships if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the collection of memberships
	 */
	getMemberships(
		groupID: string,
		options?: {
			limit?: number;
			offset?: number;
		},
		callback?: Function
	) {
		var apiPath = urlPath(BASE_PATH, groupID, MEMBERSHIPS_SUBRESOURCE),
			params = {
				qs: options,
			};

		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Retreieve a list of groups in the caller's enterprise.  This ability is
	 * restricted to certain users with permission to view groups.
	 *
	 * API Endpoint: '/groups'
	 * Method: GET
	 *
	 * @param {Object} [options] - Optional parameters, can be left null in most cases
	 * @param {string} [options.filter_term] - Limits the results to only groups whose name starts with the search term
	 * @param {int} [options.limit] - The number of memberships to retrieve
	 * @param {int} [options.offset] - Paging marker, retrieve records starting at this position in the list
	 * @param {Function} [callback] - Passed a list of groups if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the collection of groups
	 */
	getAll(
		options?: {
			filter_term?: string;
			limit?: number;
			offset?: number;
		},
		callback?: Function
	) {
		var apiPath = urlPath(BASE_PATH),
			params = {
				qs: options,
			};

		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			params,
			callback
		);
	}

	/**
	 * Retreieve a list of collaborations for the group, which show which items the
	 * group has access to.
	 *
	 * API Endpoint: '/groups/:groupID/collaborations'
	 * Method: GET
	 *
	 * @param {string} groupID - The ID of the group to get collaborations for
	 * @param {Object} [options] - Optional parameters, can be left null in most cases
	 * @param {int} [options.limit] - The number of memberships to retrieve
	 * @param {int} [options.offset] - Paging marker, retrieve records starting at this position in the list
	 * @param {Function} [callback] - Passed a list of collaborations if successful, error otherwise
	 * @returns {Promise<Object>} A promise resolving to the collection of collaborations for the group
	 */
	getCollaborations(
		groupID: string,
		options?: {
			limit?: number;
			offset?: number;
		},
		callback?: Function
	) {
		var apiPath = urlPath(BASE_PATH, groupID, COLLABORATIONS_SUBRESOURCE),
			params = {
				qs: options,
			};

		return this.client.wrapWithDefaultHandler(this.client.get)(
			apiPath,
			params,
			callback
		);
	}
}

/**
 * Enum of valid access levels for groups, which are used to specify who can
 * perform certain actions on the group.
 * @enum {GroupAccessLevel}
 */
Groups.prototype.accessLevels = GroupAccessLevel;

/**
 * Enum of valid user roles within a group
 * @enum {GroupUserRole}
 */
Groups.prototype.userRoles = GroupUserRole;

export = Groups;
