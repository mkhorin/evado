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