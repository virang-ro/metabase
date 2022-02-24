import { createSelector } from "reselect";
import { msgid, ngettext, t } from "ttag";
import _ from "underscore";

import { getMetadataWithHiddenTables } from "metabase/selectors/metadata";

import Group from "metabase/entities/groups";
import Tables from "metabase/entities/tables";

import { isAdminGroup, isDefaultGroup } from "metabase/lib/groups";
import {
  getTableEntityId,
  getSchemaEntityId,
  getDatabaseEntityId,
} from "../../utils/data-entity-id";

import { buildFieldsPermissions } from "./fields";
import { buildTablesPermissions } from "./tables";
import { buildSchemasPermissions } from "./schemas";
import {
  getDatabasesEditorBreadcrumbs,
  getGroupsDataEditorBreadcrumbs,
} from "./breadcrumbs";

export const getIsLoadingDatabaseTables = (state, props) => {
  const dbId = props.params.databaseId;

  return Tables.selectors.getLoading(state, {
    entityQuery: {
      dbId,
      include_hidden: true,
    },
  });
};

export const getLoadingDatabaseTablesError = (state, props) => {
  const dbId = props.params.databaseId;

  return Tables.selectors.getError(state, {
    entityQuery: {
      dbId,
      include_hidden: true,
    },
  });
};

const getRouteParams = (_state, props) => {
  const { databaseId, schemaName, tableId } = props.params;
  return {
    databaseId,
    schemaName,
    tableId,
  };
};

const getDataPermissions = state => state.admin.permissions.dataPermissions;

const getGroupRouteParams = (_state, props) => {
  const { groupId, databaseId, schemaName } = props.params;
  return {
    groupId: groupId != null ? parseInt(groupId) : null,
    databaseId,
    schemaName,
  };
};

const getEditorEntityName = ({ databaseId, schemaName }, hasSingleSchema) => {
  if (schemaName != null || hasSingleSchema) {
    return t`Table name`;
  } else if (databaseId) {
    return t`Schema name`;
  } else {
    return t`Database name`;
  }
};

const getFilterPlaceholder = ({ databaseId, schemaName }, hasSingleSchema) => {
  if (schemaName != null || hasSingleSchema) {
    return t`Search for a table`;
  } else if (databaseId) {
    return t`Search for a schema`;
  } else {
    return t`Search for a database`;
  }
};

const getGroup = (state, props) =>
  Group.selectors.getObject(state, {
    entityId: parseInt(props.params.groupId),
  });

export const getDatabasesPermissionEditor = createSelector(
  getMetadataWithHiddenTables,
  getGroupRouteParams,
  getDataPermissions,
  getGroup,
  Group.selectors.getList,
  getIsLoadingDatabaseTables,
  (metadata, params, permissions, group, groups, isLoading) => {
    const { groupId, databaseId, schemaName } = params;

    if (isLoading || !permissions || groupId == null) {
      return null;
    }

    const isAdmin = isAdminGroup(group);
    const defaultGroup = _.find(groups, isDefaultGroup);
    const hasSingleSchema =
      databaseId != null &&
      metadata.database(databaseId).getSchemas().length === 1;

    const columns = [
      getEditorEntityName(params, hasSingleSchema),
      t`Data access`,
      t`Native query editing`,
    ];

    let entities = [];

    if (schemaName != null || hasSingleSchema) {
      const schema = hasSingleSchema
        ? metadata.database(databaseId).getSchemas()[0]
        : metadata.database(databaseId).schema(schemaName);

      entities = schema
        .getTables()
        .sort((a, b) => a.display_name.localeCompare(b.display_name))
        .map(table => {
          const entityId = getTableEntityId(table);
          return {
            id: table.id,
            name: table.display_name,
            entityId,
            permissions: buildFieldsPermissions(
              entityId,
              groupId,
              isAdmin,
              permissions,
              defaultGroup,
              metadata.database(databaseId),
            ),
          };
        });
    } else if (databaseId != null) {
      entities = metadata
        .database(databaseId)
        .getSchemas()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(schema => {
          const entityId = getSchemaEntityId(schema);
          return {
            id: schema.id,
            name: schema.name,
            entityId,
            canSelect: true,
            permissions: buildTablesPermissions(
              entityId,
              groupId,
              isAdmin,
              permissions,
              defaultGroup,
            ),
          };
        });
    } else if (groupId != null) {
      entities = metadata
        .databasesList({ savedQuestions: false })
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(database => {
          const entityId = getDatabaseEntityId(database);
          return {
            id: database.id,
            name: database.name,
            entityId,
            canSelect: true,
            permissions: buildSchemasPermissions(
              entityId,
              groupId,
              isAdmin,
              permissions,
              defaultGroup,
              database,
            ),
          };
        });
    }

    const breadcrumbs = getDatabasesEditorBreadcrumbs(params, metadata, group);
    const title = t`Permissions for the `;

    return {
      title,
      breadcrumbs,
      description:
        group != null
          ? ngettext(
              msgid`${group.member_count} person`,
              `${group.member_count} people`,
              group.member_count,
            )
          : null,
      filterPlaceholder: getFilterPlaceholder(params, hasSingleSchema),
      columns,
      entities,
    };
  },
);

export const getGroupsDataPermissionEditor = createSelector(
  getMetadataWithHiddenTables,
  getRouteParams,
  getDataPermissions,
  Group.selectors.getList,
  (metadata, params, permissions, groups) => {
    const { databaseId, schemaName, tableId } = params;

    if (!permissions || databaseId == null) {
      return null;
    }

    const defaultGroup = _.find(groups, isDefaultGroup);

    const columns = [t`Group name`, t`Data access`, t`Native query editing`];

    const entities = groups.map(group => {
      const isAdmin = isAdminGroup(group);
      let groupPermissions;

      if (tableId != null) {
        groupPermissions = buildFieldsPermissions(
          {
            databaseId,
            schemaName,
            tableId,
          },
          group.id,
          isAdmin,
          permissions,
          defaultGroup,
          metadata.database(databaseId),
        );
      } else if (schemaName != null) {
        groupPermissions = buildTablesPermissions(
          {
            databaseId,
            schemaName,
          },
          group.id,
          isAdmin,
          permissions,
          defaultGroup,
        );
      } else if (databaseId != null) {
        groupPermissions = buildSchemasPermissions(
          {
            databaseId,
          },
          group.id,
          isAdmin,
          permissions,
          defaultGroup,
          metadata.database(databaseId),
        );
      }

      return {
        id: group.id,
        name: group.name,
        hint: isAdmin
          ? t`The Administrators group is special, and always has Unrestricted access.`
          : null,
        entityId: params,
        permissions: groupPermissions,
      };
    });

    return {
      title: t`Permissions for`,
      filterPlaceholder: t`Search for a group`,
      breadcrumbs: getGroupsDataEditorBreadcrumbs(params, metadata),
      columns,
      entities,
    };
  },
);
