/** Initialization code for the project overview page. */
'use strict';

var $ = require('jquery');
require('jquery-tagsinput');
require('bootstrap-editable');
require('js/osfToggleHeight');

var m = require('mithril');
var Fangorn = require('js/fangorn');
var Raven = require('raven-js');
var lodashGet  = require('lodash.get');
require('truncate');

var $osf = require('js/osfHelpers');
var LogFeed = require('js/components/logFeed');
var pointers = require('js/pointers');
var Comment = require('js/comment'); //jshint ignore:line
var NodeActions = require('js/project');
var NodeControl = require('js/nodeControl');
var CitationList = require('js/citationList');
var CitationWidget = require('js/citationWidget');
var mathrender = require('js/mathrender');
var md = require('js/markdown').full;
var AddProject = require('js/addProjectPlugin');
var mHelpers = require('js/mithrilHelpers');
var SocialShare = require('js/components/socialshare');

var ctx = window.contextVars;
var node = window.contextVars.node;
var nodeApiUrl = ctx.node.urls.api;
var nodeCategories = ctx.nodeCategories || [];


// Listen for the nodeLoad event (prevents multiple requests for data)
$('body').on('nodeLoad', function(event, data) {
    if (!data.node.is_retracted) {
        // Initialize controller for "Add Links" modal
        new pointers.PointerManager('#addPointer', window.contextVars.node.title);
    }
    // Initialize CitationWidget if user isn't viewing through an anonymized VOL
    if (!data.node.anonymous && !data.node.is_retracted) {
        var citations = data.node.alternative_citations;
        new CitationList('#citationList', citations, data.user);
        new CitationWidget('#citationStyleInput', '#citationText');
    }
    // Initialize nodeControl
    new NodeControl.NodeControl('#projectScope', data, {categories: nodeCategories});
});

// Initialize comment pane w/ its viewmodel
var $comments = $('.comments');
if ($comments.length) {
    var options = {
        nodeId : window.contextVars.node.id,
        nodeApiUrl: window.contextVars.node.urls.api,
        isRegistration: window.contextVars.node.isRegistration,
        page: 'node',
        rootId: window.contextVars.node.id,
        fileId: null,
        canComment: window.contextVars.currentUser.canComment,
        hasChildren: window.contextVars.node.hasChildren,
        currentUser: window.contextVars.currentUser,
        pageTitle: window.contextVars.node.title,
        inputSelector: '.atwho-input'
    };
    Comment.init('#commentsLink', '.comment-pane', options);
}
var institutionLogos = {
    controller: function(args){
        var self = this;
        self.institutions = args.institutions;
        self.nLogos = self.institutions.length;
        self.side = self.nLogos > 1 ? (self.nLogos === 2 ? '50px' : '35px') : '75px';
        self.width = self.nLogos > 1 ? (self.nLogos === 2 ? '115px' : '86px') : '75px';
        self.makeLogo = function(institution){
            return m('a', {href: '/institutions/' + institution.id},
                m('img', {
                    height: self.side, width: self.side,
                    style: {margin: '3px'},
                    title: institution.name,
                    src: institution.logo_path
                })
            );
        };
    },
    view: function(ctrl, args){
        var tooltips = function(){
            $('[data-toggle="tooltip"]').tooltip();
        };
        var instCircles = $.map(ctrl.institutions, ctrl.makeLogo);
        if (instCircles.length > 4){
            instCircles[3] = m('.fa.fa-plus-square-o', {
                style: {margin: '6px', fontSize: '250%', verticalAlign: 'middle'},
            });
            instCircles.splice(4);
        }

        return m('', {style: {float: 'left', width: ctrl.width, textAlign: 'center', marginRight: '10px'}, config: tooltips}, instCircles);
    }
};


$(document).ready(function () {

    var node_id = window.contextVars.node.id;
    // note below syntax in query allows multiple parameters of same param
    // XXX - nesting here looks a bit weird, might want to split up into declared objs?
    var nodeComponentURL =  $osf.apiV2Url('/nodes/' + node_id + '/children/',
                                           {query:
                                               {
                                                   embed: ['logs','contributors']
                                               }
                                           });
    console.log('using API url - ' + nodeComponentURL);

    var componentsNodesInParents = {
        // contains components for "Recent Activity"
        body_hide: function(nodeData){
            console.log(nodeData.embeds.logs.data);

            return m('div#body-'+nodeData.id+'.body.hide', [
                m('hr'),
                m.trust('Recent Activity'),
                m('div#logFeed-'+nodeData.id, [
                    m('div.spinner-loading-wrapper', [
                        m('div.logo-spin.logo-lg'),
                        m('p.m-t-sm.fg-load-message', 'Loading logs...')
                    ]),
                ])

            ])
        },
        // XXX - below get_name/get_id access same information, should be refactored into ONE thing and probably less deep in JSON (multiple calls maybe instead of embeds?)
        get_user_name: function(nodeData) {
        //  XXX-#4-email - currently only retrieves FIRST suffix name
        // retrieves suffix of contributors (deeply nested in return object)
            return nodeData.embeds.contributors.data[0].embeds.users.data.attributes.suffix;
        },
        get_user_id: function(nodeData) {
        //  XXX-#4-email - currently only retrieves FIRST id
            // console.log(nodeData.embeds.contributors.data[0].embeds.users.data.id);
            return nodeData.embeds.contributors.data[0].embeds.users.data.id;
        },
        group_heading: function(nodeData){
            // XXX - positioning different, but has to avoid a href, unsure what to do here
            return [m('a', {href: '/'+nodeData.id},
                        [m('h4.list-group-item-heading',nodeData.attributes.title)]),
                    m('div.pull-right',
                        m('i#icon-'+nodeData.id+'.pointer.fa.fa-angle-down',
                          {
                              onclick: function(){
                                  NodeActions.openCloseNode(nodeData.id)
                              }
                          })
                      )
                ];
        },
        controller: function(args){
            console.log(args);
            this.nodes = args.data
        },
        view: function(ctrl, args){
            return m('ul.list-group.m-md.sortable.ui-sortable',[
                // Generates Component on a component-by-component basis
                m('span#components', ctrl.nodes.map(function(nodeData){
                    // adds an 's', maybe a pluralizer in codebase somewhere? no time
                    var pluralize_contribution = nodeData.embeds.logs.links.meta.total > 1 ? 's' : '';
                    return m('div.render-node',[
                        m('li.project.list-group-item.list-group-item-node.cite-container',[
                            // Header Section - see self.group_heading() for details
                            componentsNodesInParents.group_heading(nodeData),
                            m('div.project-authors', [
                                // Name/Suffix Section - see self.get_user_name() for detials
                                // see get_user_id() for details on how href is generated
                                m('a.overflow',
                                  {href: componentsNodesInParents.get_user_id(nodeData)},
                                  componentsNodesInParents.get_user_name(nodeData))
                            ]),
                            m('span.text-muted', nodeData.embeds.logs.links.meta.total + ' contribution' + pluralize_contribution),
                            // See More Section -- see self.body_hide() for details
                            componentsNodesInParents.body_hide(nodeData),  // see self.body_hide
                            ]
                        )
                    ])
                })
                )
                // ICONS - LOCK OR NOT LOGIC (Private icon lines 14 - 36 in render_node.mako )
                // PROJECT status (getIcon line ~37 in render_node.mako)
                // log feed (line ~105 in render_node.mako)
            ]);
        },
    };

    $osf.ajaxJSON('GET', nodeComponentURL, {fields: {isCors:true}})
        .done(function(data){
            console.log(data);
            var componentsNodesInParentsWrapper = m.component(componentsNodesInParents, data);
            m.mount(document.getElementById('componentsParent'), componentsNodesInParentsWrapper);
        });



    var AddComponentButton = m.component(AddProject, {
        buttonTemplate: m('.btn.btn-sm.btn-default[data-toggle="modal"][data-target="#addSubComponent"]', {onclick: function() {
            $osf.trackClick('project-dashboard', 'add-component', 'open-add-project-modal');
        }}, 'Add Component'),
        modalID: 'addSubComponent',
        title: 'Create new component',
        parentID: window.contextVars.node.id,
        parentTitle: window.contextVars.node.title,
        categoryList: nodeCategories,
        stayCallback: function() {
            // We need to reload because the components list needs to be re-rendered serverside
            window.location.reload();
        },
        trackingCategory: 'project-dashboard',
        trackingAction: 'add-component',
        contributors: window.contextVars.node.contributors,
        currentUserCanEdit: window.contextVars.currentUser.canEdit
    });

    var newComponentElem = document.getElementById('newComponent');
    if (newComponentElem) {
        m.mount(newComponentElem, AddComponentButton);
    }

    if (ctx.node.institutions.length && !ctx.node.anonymous){
        m.mount(document.getElementById('instLogo'), m.component(institutionLogos, {institutions: window.contextVars.node.institutions}));
    }
    $('#contributorsList').osfToggleHeight();

    if (!ctx.node.isRetracted) {
        // Recent Activity widget
        m.mount(document.getElementById('logFeed'), m.component(LogFeed.LogFeed, {node: node}));

        // Treebeard Files view
        $.ajax({
            url:  nodeApiUrl + 'files/grid/'
        }).done(function (data) {
            var fangornOpts = {
                divID: 'treeGrid',
                filesData: data.data,
                allowMove: !node.isRegistration,
                uploads : true,
                showFilter : true,
                placement: 'dashboard',
                title : undefined,
                filterFullWidth : true, // Make the filter span the entire row for this view
                xhrconfig: $osf.setXHRAuthorization,
                columnTitles : function () {
                    return [
                        {
                            title: 'Name',
                            width : '70%',
                            sort : true,
                            sortType : 'text'
                        },
                        {
                            title: 'Modified',
                            width : '30%',
                            sort : true,
                            sortType : 'text'
                        }
                    ];
                },
                resolveRows : function (item) {
                    var tb = this;
                    item.css = '';
                    if(tb.isMultiselected(item.id)){
                        item.css = 'fangorn-selected';
                    }
                    if(item.data.permissions && !item.data.permissions.view){
                        item.css += ' tb-private-row';
                    }
                    var defaultColumns = [
                                {
                                data: 'name',
                                folderIcons: true,
                                filter: true,
                                custom: Fangorn.DefaultColumns._fangornTitleColumn},
                                {
                                data: 'modified',
                                folderIcons: false,
                                filter: false,
                                custom: Fangorn.DefaultColumns._fangornModifiedColumn
                            }];
                    if (item.parentID) {
                        item.data.permissions = item.data.permissions || item.parent().data.permissions;
                        if (item.data.kind === 'folder') {
                            item.data.accept = item.data.accept || item.parent().data.accept;
                        }
                    }
                    if(item.data.uploadState && (item.data.uploadState() === 'pending' || item.data.uploadState() === 'uploading')){
                        return Fangorn.Utils.uploadRowTemplate.call(tb, item);
                    }

                    var configOption = Fangorn.Utils.resolveconfigOption.call(this, item, 'resolveRows', [item]);
                    return configOption || defaultColumns;
                }
            };
            var filebrowser = new Fangorn(fangornOpts);
        });
    }

    // Tooltips
    $('[data-toggle="tooltip"]').tooltip({container: 'body'});

    // Tag input
    $('#node-tags').tagsInput({
        width: '100%',
        interactive: window.contextVars.currentUser.canEdit,
        maxChars: 128,
        onAddTag: function(tag) {
            var url = nodeApiUrl + 'tags/';
            var data = {tag: tag};
            var request = $osf.postJSON(url, data);
            request.fail(function(xhr, textStatus, error) {
                Raven.captureMessage('Failed to add tag', {
                    extra: {
                        tag: tag, url: url, textStatus: textStatus, error: error
                    }
                });
            });
        },
        onRemoveTag: function(tag) {
            var url = nodeApiUrl + 'tags/';
            // Don't try to delete a blank tag (would result in a server error)
            if (!tag) {
                return false;
            }
            var request = $osf.ajaxJSON('DELETE', url, {'data': {'tag': tag}});
            request.fail(function(xhr, textStatus, error) {
                // Suppress "tag not found" errors, as the end result is what the user wanted (tag is gone)- eg could be because two people were working at same time
                if (xhr.status !== 409) {
                    $osf.growl('Error', 'Could not remove tag');
                    Raven.captureMessage('Failed to remove tag', {
                        extra: {
                            tag: tag, url: url, textStatus: textStatus, error: error
                        }
                    });
                }
            });
        }
    });

    $('#addPointer').on('shown.bs.modal', function(){
        if(!$osf.isIE()){
            $('#addPointer input').focus();
        }
    });

    // Limit the maximum length that you can type when adding a tag
    $('#node-tags_tag').attr('maxlength', '128');

    // Wiki widget markdown rendering
    if (ctx.wikiWidget) {
        // Render math in the wiki widget
        var markdownElement = $('#markdownRender');
        mathrender.mathjaxify(markdownElement);

        // Render the raw markdown of the wiki
        if (!ctx.usePythonRender) {
            var request = $.ajax({
                url: ctx.urls.wikiContent
            });
            request.done(function(resp) {
                var rawText = resp.wiki_content || '*No wiki content*';
                var renderedText = md.render(rawText);
                var truncatedText = $.truncate(renderedText, {length: 400});
                markdownElement.html(truncatedText);
                mathrender.mathjaxify(markdownElement);
                markdownElement.show();
            });
        } else {
            markdownElement.css('display', 'inherit');
        }
    }

    // Remove delete UI if not contributor
    if (!window.contextVars.currentUser.canEdit || window.contextVars.node.isRegistration) {
        $('a[title="Removing tag"]').remove();
        $('span.tag span').each(function(idx, elm) {
            $(elm).text($(elm).text().replace(/\s*$/, ''));
        });
    }

    if (window.contextVars.node.isPublic) {
        m.mount(document.getElementById('shareButtonsPopover'),
                m.component(SocialShare.ShareButtonsPopover,
                    {title: window.contextVars.node.title, url: window.location.href}));
    }
});
