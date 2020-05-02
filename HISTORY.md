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
* web/jam/data-grid/ColumnRenderer
    - fix empty array as not set value   
    
## 1.2.0

* component/other/CommonSearch
    - add search by object title     
* component/other/DataGrid
    - customize query limit    
* component/security/PasswordAuthService
    - replace messages to keys     
* model/File
    - check svg format          
* model/auth/SignUpForm
    - disable mandatory verification after sign up   
* web/jam/data-grid/ColumnRenderer
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
* component/other/ListFilter 
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
* component/other/DataGrid
    - extract common search as separate entity
* component/other/ListFilter
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
* component/other/Formatter
    - add translatable format
* console/SecurityConsole 
    - fix user creation        
* view/template/default
    - translate error pages    
* web/jam/data-grid/ColumnRenderer
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
    - add input accept from mime type validator

## 0.1.11

* component/base/BaseController
    - add filter column resolver
* component/other/DataGrid
    - make ListFilterCondition configurable
* component/other/ListFilterCondition
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