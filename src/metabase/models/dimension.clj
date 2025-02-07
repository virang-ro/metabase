(ns metabase.models.dimension
  "Dimensions are used to define remappings for Fields handled automatically when those Fields are encountered by the
  Query Processor. For a more detailed explanation, refer to the documentation in
  `metabase.query-processor.middleware.add-dimension-projections`."
  (:require [metabase.util :as u]
            [toucan.models :as models]))

(def dimension-types
  "Possible values for `Dimension.type`"
  #{:internal
    :external})

(models/defmodel Dimension :dimension)

(u/strict-extend (class Dimension)
  models/IModel
  (merge models/IModelDefaults
         {:types      (constantly {:type :keyword})
          :properties (constantly {:timestamped? true
                                   :entity_id    true})}))
