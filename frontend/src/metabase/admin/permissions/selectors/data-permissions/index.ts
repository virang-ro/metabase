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
} from "../utils/data-entity-id";
import {
  getDatabaseFocusPermissionsUrl,
  getGroupFocusPermissionsUrl,
} from "../utils/urls";
import { buildFieldsPermissions } from "./data-permissions/fields";
import { buildTablesPermissions } from "./data-permissions/tables";
import { buildSchemasPermissions } from "./data-permissions/schemas";

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

