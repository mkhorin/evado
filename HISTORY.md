## 5.8.0
 
* controller/AuthController
    - add auto-login after registration
* view/template/_part/attr/string
    - fix autocomplete attribute
* web/jam/helper/Helper
    - update deprecated clipboard copy method    
* web/style/data-grid
    - fix table borders in firefox
* upgrade dependencies

## 5.7.0
 
* component/misc/ListFilter
    - add filter by regular expression 
* web/jam/helper/ArrayHelper
    - add comparison of unordered arrays
* web/jam/grid/Tuner
    - customize order of grid columns    
* upgrade dependencies

## 5.6.0
 
* component/misc/CommonSearch
    - check unwanted value types
* web/jam/actionBinder/ActionBinder
    - prevent looping after model modification
* web/jam/list/PageJumper 
    - replace page jumper select with input
* upgrade dependencies

## 5.5.0
 
* component/meta/MetaListFilter
    - add filter by empty back references 
* component/misc/ListFilter
    - add case-sensitive filter
    - add string as empty filter value
* web/jam/attr/CheckboxEnum
    - add multiple choice of enumeration values
* web/jam/attr/RelationCheckboxList
    - add checkbox list view to relation
* web/jam/attr/RelationRadioList
    - add radio list view to relation
* web/jam/frame/FrameStack
    - ignore frame close by escape on input elements
* web/jam/helper/PopoverHelper
    - fix popover hiding
* web/jam/helper/ScrollHelper
    - fix scroll offset
* web/jam/helper/SelectHelper
    - fix selection rendering
* web/jam/list/DataFormatter
    - add customizable separator
* web/jam/list/List
    - add custom command parameters
* web/jam/listFilter/ListFilterTypeSelector
    - fix scrolling freeze after filtering
* web/jam/misc/Dialog
    - fix dialog message escaping

## 5.4.0

* component/job/DeleteExpiredFiles
    - delete expired S3 file records
* component/job/DeleteExpiredSessions
    - add a task to delete expired sessions 
* component/misc/DataGrid
    - override request data using params
* component/helper/ModelHelper
    - rename overflow truncation params
* component/security/Auth
    - add login and logout events
* component/security/rbac/Item
    - accept assignment rule as a string
* model/RawFile
    - catch file deletion errors from storage
* web/jam/listFilter/ListFilterTypeNumber
    - fix numeric type for list filter
* web/jam/misc/ValueMask
    - add input masks
* web/style/main.css
    - wrap overflowed menu labels

## 5.3.0

* component/meta/BaseMenu
    - fix navigation access control for children of parents
* decorate label popup tooltip
* web/jam/helper/CookieHelper
    - move cookie management to a separate helper
* web/jam/helper/SelectHelper
    - fix select2 focus
* web/jam/grid/CardRenderer
    - fix grid card view
* web/jam/grid/TreeGridNode
    - fix tree list view
* web/jam/grid/Tuner
    - fix grid tuner position
* web/jam/list/Pagination
    - fix pagination toggles
* web/jam/listFilter/ListFilterCondition
    - fix default filter type
* web/jam/listFilter/ListFilterTypeNested
    - add nested condition to filter
* web/jam/misc/Dialog
    - close popup on press mouse down

## 5.2.0

* component/misc/HierarchySolver
    - add parent and descendants query
* component/misc/ListFilter
    - fix priority of logical operations
* component/security/rbac/MetaNavInspector
    - search menu nodes with parent security
* console/asset
    - remove asset configuration inheritance
* view/template/_layout/frame/modelForm
    - add ID title to copy button
* web/jam/attr/Enum
    - add option hint
    - clear displayed value when switching enum sets
* web/jam/attr/Json
     - normalize string JSON
* web/jam/attr/Text
    - automatically adjust text field height
* web/jam/element/Alert
    - parse structural message and ignore if it is empty
* web/jam/element/NavTree
    - scroll to active menu item
* web/jam/misc/Dialog
    - escape HTML tags by default
* web/style/main
    - fix global loader overlay
    - make fixed top panel

## 5.1.0

* component/meta/MetaGrid
    - order objects by class attribute
* component/misc/ClientMessage
    - create parameterized messages for translation on the client side
* component/misc/DataGrid
    - check negative offset
* config/default-assets
    - separate action binder sources
* filter by attributes of descendant classes
* model/AutoIncrement
    - move auto increment table to model
* web/jam/attr/Attr
    - normalize dependency names
* web/jam/frame/StackFrame
    - fix name of frame params
* web/jam/helper/FormatHelper
    - check number type before formatting
* web/jam/helper/StringHelper
    - convert non-string data to string
* web/jam/misc/Dialog
    - reset focus when focusing on an unwanted element
* web/style/main
    - add attribute label icon for an extended hint
    - prevent from wrapping icon to next line

## 5.0.0

* component/action/SortRelatedArrayAction
    - fix related object sorting
* component/meta/rbac/rule
    - add rules to check reference chains
* component/security/rbac
    - add multiple rules to one permission
    - add view history of model changes as security action
    - fix order of imported rules
    - optimize security check of metadata transitions
    - refactor metadata transition security
* test/run/component/helper/select
    - add tests for the select helper
* upgrade Node.js version
* upgrade dependencies
* view/template/_part/attr/checkbox
    - fix hints for checkboxes
* web/jam/frame
    - fix closing stack frames with escape
* web/style/main
    - fix white button

## 4.0.0

* component/base/CrudController
    - loadable groups and tabs
* component/file/FileStorage
    - add file hashing
* component/file/S3Storage
    - add S3 storage
* config/default
    - rename thumbnail sizes
* model/RawFile
    - add file hashing
* web/jam/misc/Uploader
    - fix event handlers

## 3.1.0

* web/jam/helper/DateHelper
    - check invalid date format
* upgrade dependencies

## 3.0.0

* component/security/rbac/Rbac
    - fix undefined base meta model
* console/Console
    - define node environment via console
* migration to Bootstrap 5
* web/jam/misc/I18n
    - add formatted messages with parameters
* web/jam/misc/Resource
    - fix resource key

## 2.2.0

* console/asset/AssetBuilder
    - refactor asset building
* move frontend sources to web
* remove unused fonts
* switch language from frontend

## 2.1.0

* asset/jam/dataGrid
    - refactor data grid render
* asset/jam/list
    - load a list on demand
* component/meta/MetaModels
    - remove undefined model creation
* console/AssetConsole
    - refactor asset managers

## 2.0.0

* console/AssetConsole
    - add asset building
* controller/AuthController
    - customize URL after logout
* component/base/CrudController
    - add custom params to cloning sample getter
* component/validator/PasswordValidator
* component/validator/UserNameValidator
* migration to Bootstrap 4
* use optional chaining
* web/jam/attr/Enum
    - fix radio list

## 1.8.0

* component/helper/MetaHelper
    - extract comparison methods
* component/notifier/MessageTemplate
    - add data preparation
* component/notifier/Notification
    - add template and recipient filter configurations
* component/notifier/NotificationMessage
    - add recipients on message creating
* component/observer/Observer
    - cascading handling by event name
* component/security/rbac/MetaTransitionInspector
    - refactor transition security
* component/security/rbac/Rbac
    - refactor item indexing
* console/Console
    - get server port from console arguments
* console/NotificationConsole
    - throw error on non-existent user filter
* console/UserFilterConsole
    - throw error on non-existent security item

## 1.7.1

* component/meta/MetaSecurity
    - fix relation view to resolve access
* console/SecurityConsole
    - add user data update
* web/jam/element/Modal
    - fix modal frame close

## 1.7.0

* component/base/CrudController
    - fix default values on create
* component/security/rbac/Item
    - catch errors on assignment rule execution
* console/Console
    - normalize imported configuration data
    - remove uploaded files on clear all
* model/auth/ChangePasswordForm
    - log previous password hash
* model/DataHistory
    - move from Office module
* web/jam/data-grid/DataGrid
    - fix grid body translation

## 1.6.0

* component/base/BaseController
    - CSRF token validation
* component/notifier/Notification
    - add notification translation
* component/scheduler/Scheduler
    - fix task name
* console/Console
    - configure event handlers
    - configure listeners
* model/Task
    - add task description

## 1.5.0

* component/meta/MetaSecurity
    - fix relation security by view
* component/notifier/Notifier
    - add service message data
* component/security/rbac/Rbac
    - fix security by object states
* component/utility/UtilityManager
    - refactor utility render

## 1.4.0

* component/meta/MetaCommonSearch
    - add search by embedded model title
* component/meta/rbac/rule/AuthorRule
    - add rule customization
* component/meta/rbac/rule/RefUserRule
    - check user by reference attribute
* component/security/PasswordAuthService
    - set ID to new user
* component/security/rbac/MetaInspector
    - fix object filter
* console/AssetConsole
    - manage assets of each module separately
* console/ModuleAsset
    - move and rename deployed vendor
* console/SecurityConsole
    - export/import users and assignments
* web/jam/attr/Enum
    - keep item order

## 1.3.0

* component/meta/MetaGrid
    - add count method
    - render thumbnail without related model
* component/meta/MetaListFilter
    - fix empty relation condition
* component/meta/MetaModel
    - upgrade base meta model
* model/RawFile
    - add user limits to file upload
* web/jam/list/DataFormatter
    - fix empty array as not set value

## 1.2.0

* component/misc/CommonSearch
    - add search by object title
* component/misc/DataGrid
    - customize query limit
* component/security/PasswordAuthService
    - replace messages to keys
* model/File
    - check svg format
* model/auth/SignUpForm
    - disable mandatory verification after sign up
* web/jam/list/DataFormatter
    - model data is available in each attribute value handler
* web/jam/element/Modal
    - refactor modal element names

## 1.1.0

* component/action/SortRelatedAction
    - add 'with' query param
    - add nested condition parser
    - fix overridden models filter
* component/meta/MetaGrid
    - add actual meta class name to item
    - add meta class format
    - fix related thumbnail size
* component/misc/ListFilter
    - extract item parser to separate method
* component/security/rbac/Rbac
    - inherit metadata permissions ​​from base meta class
* fix css styles
* upgrade dependencies

## 1.0.0

* component/security/rbac/Item
    - expand arrayed metadata permissions targets
* console/SecurityConsole
    - add security data deletion
* web/jam/model/ActionBinder
    - fix attribute default value
* web/jam/model/Model
    - add dynamic dependency data
* view/template/_layout/list
    - extract layout from list templates

## 0.7.0

* component/utility/UtilityManager
    - resolve utility spawn configurations
* console/SecurityConsole
    - fix security export/import
* console/TaskConsole
    - fix task creation
* web/jam/model/Model
    - fix serialize model form

## 0.6.0

* component/file/FileStorage
    - add copy methods
* component/scheduler
    - add job to delete expired files
* config/default
    - replace common menu title
* console/DataConsole
    - add file export/import
* parse JSON configuration
* update dependencies

## 0.5.0

* fix CSS
* fix templates
* update dependencies

## 0.4.0

* add some tests
* component/meta/MetaGrid
    - add state view type
* component/meta/MetaTreeGrid
    - fix render model
* component/utility/Utility
    - refactor utilities
* component/widget/CommonMenu
    - configure common menu title
* controller/FileController
    - return raw file size
* fix CSS
* update dependencies

## 0.3.0

* component/meta/rbac
    - add multiple targets to metadata permission
* component/misc/DataGrid
    - extract common search as separate entity
* component/misc/ListFilter
    - filter by nested values via intermediate relation
* component/security
    - fix permission restriction by rule
* controller/FileController
    - check file availability before downloading
* web/jam/element/Modal
    - fix resize modal tabs
* web/jam/util/Uploader
    - translate and format validation messages

## 0.2.0

* component/helper/MetaHelper
    - move common helper from modules
* component/misc/Formatter
    - add translatable format
* console/SecurityConsole
    - fix user creation
* view/template/default
    - translate error pages
* web/jam/list/DataFormatter
    - separate null and undefined view
* web/jam/element/LoadableContent
    - add resource solver and translation
* web/jam/element/Modal
    - fix tab templates

## 0.1.12

* component/meta/MetaGrid
    - fix file attribute render
* module/api
    - add API module
* web/jam/data-grid
    - add grouping rows
* web/jam/element/Modal
    - custom alert dialog
* web/jam/list/ListFilter
    - fix selector type
* web/jam/util/Uploader
    - add input accept from media type validator

## 0.1.11

* component/base/BaseController
    - add filter column resolver
* component/misc/DataGrid
    - make ListFilterCondition configurable
* component/misc/ListFilterCondition
    - add nested value parser
    - add inline value parser
    - add relation parser
    - fix date parser
* component/widget/SideMenu
    - add base sidebar menu widget
* web/jam/helper/Helper
    - fix date formatter
* web/jam/list/ListFilter
    - add nested value

## 0.1.10

* component/action/CaptchaAction
    - add captcha action
* component/action/ErrorAction
    - fix auth redirect
* component/helper/ModelHelper
    - fix format by rules
* component/mailer
    - add mailer components
* component/notifier
    - resolve recipients by security assignments
* component/security/PasswordAuthService
    - refactor service
* model/auth
    - add password reset form
    - add verification form