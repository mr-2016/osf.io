/**
 * Github FileBrowser configuration module.
 */
;(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['js/fangorn'], factory);
    } else if (typeof $script === 'function') {
        $script.ready('fangorn', function() { factory(Fangorn); });
    } else { factory(Fangorn); }
}(this, function(Fangorn) {

    // Define Fangorn Button Actions
    function _fangornActionColumn (item, col){
        var self = this;
        var buttons = [];

        function _uploadEvent (event, item, col){
            event.stopPropagation();
            this.dropzone.hiddenFileInput.click();
            this.dropzoneItemCache = item;
            console.log('Upload Event triggered', this, event,  item, col);
        }

        function _removeEvent (event, item, col) {
            event.stopPropagation();
            console.log('Remove Event triggered', this, event, item, col);
            var tb = this;
            if(item.data.permissions.edit){
                // delete from server, if successful delete from view
                $.ajax({
                  url: item.data.urls.delete,
                  type : 'DELETE'
                })
                .done(function(data) {
                    // delete view
                    tb.deleteNode(item.parentID, item.id);
                    console.log('Delete success: ', data);
                })
                .fail(function(data){
                    console.log('Delete failed: ', data);
                });
            }
        }

        // Download Zip File
        if (item.kind === 'folder' && item.data.addonFullname) {
            buttons.push(
            {
                'name' : '',
                'icon' : 'icon-upload-alt',
                'css' : 'fangorn-clickable btn btn-default btn-xs',
                'onclick' : _uploadEvent
            },
            {
                'name' : '',
                'icon' : 'icon-download-alt',
                'css' : 'fangorn-clickable btn btn-default btn-xs',
                'onclick' : function(){window.location = item.data.urls.zip;}
            },
            {
                'name' : '',
                'icon' : 'icon-external-link',
                'css' : 'btn btn-info btn-xs',
                'onclick' : function(){window.location = item.data.urls.repo;}//GO TO EXTERNAL PAGE
            }
            );
        } else if (item.kind === 'folder' && !item.data.addonFullname){
            buttons.push(
                {
                    'name' : '',
                    'icon' : 'icon-upload-alt',
                    'css' : 'fangorn-clickable btn btn-default btn-xs',
                    'onclick' : _uploadEvent
                }
            );
        } else if (item.kind === "item"){
            buttons.push({
                'name' : '',
                'icon' : 'icon-download-alt',
                'css' : 'btn btn-info btn-xs',
                'onclick' : function(){window.location = item.data.urls.download}
            },
            {
                'name' : '',
                'icon' : 'icon-remove',
                'css' : 'm-l-lg text-danger fg-hover-hide',
                'style' : 'display:none',
                'onclick' : _removeEvent
            }
            );
        }
        return buttons.map(function(btn){
            return m('span', { 'data-col' : item.id }, [ m('i',
                { 'class' : btn.css, style : btn.style, 'onclick' : function(){ btn.onclick.call(self, event, item, col); } },
                [ m('span', { 'class' : btn.icon}, btn.name) ])
            ]);
        });
    }

    function changeBranch(item, branch){
        var tb = this;
        var url = item.data.urls.branch + '?' + $.param({branch: branch});
        console.log(url);
        $.ajax({
            type: 'get',
            url: url
        }).done(function(response) {
            console.log("Brach Response", response);
            // Update the item with the new branch data
            $.ajax({
                type: 'get',
                url: response[0].urls.fetch
            }).done(function(data){
                console.log("data", data);
                tb.updateFolder(data, item);
                tb.redraw();
            }).fail(function(xhr, status, error){
                console.log("Error:", xhr, status, error);
            });
        });
    }

    function _fangornGithubTitle (item, col)  {
        // this = treebeard
        var tb = this;
        var branchArray = [];
        if (item.data.branches){
            for (var i = 0; i < item.data.branches.length; i++){
                branchArray.push(m("option", {value:item.data.branches[i]}, item.data.branches[i]));
            }
        }

        if (item.data.addonFullname){
            return m("span",[
                m("github-name", item.data.name),
                m("span",[
                    m("select[name=branch-selector]", {onchange: function(ev) { changeBranch.call(tb, item, ev.target.value ) } }, branchArray)
                ])
            ]);
        } else {
            return m("span",[
                m("github-name",{onclick: function(){window.location = item.data.urls.view}}, item.data.name)
            ]);
        }

    }
    function _fangornColumns (item) {
        var columns = []; 
        columns.push({
                data : 'name',
                folderIcons : true,
                custom : _fangornGithubTitle
            }); 

      if(this.options.placement === 'project-files') {
        columns.push(
            {
                css : 'action-col',
                custom : _fangornActionColumn
            },
            {
                data  : 'downloads',
                css : ''
            });
        }
        return columns; 
    } 

    function _fangornLazyLoad(item){
        if (item.data){
            window.console.log("Fangorn Lazy Load URL", item.data.urls.fetch);
            return item.data.urls.fetch;
        }
        else {
            window.console.log("Fangorn Dropdown Lazy Load URL", item.urls.fetch);
            return item.urls.fetch;
        }
    }

    function _fangornFolderIcons(item){
        //console.log("IconUrl", 'http://localhost:5000'+item.data.iconUrl);
        if(item.data.addonFullname){
            //This is a hack, should probably be changed...
            return m('img',{src:item.data.iconUrl, style:{width:"16px", height:"auto"}}, ' ');
        }
    }

    // Register configuration
    Fangorn.config.github = {
        // Handle changing the branch select
        folderIcon: _fangornFolderIcons,
        resolveRows: _fangornColumns,
        lazyload:_fangornLazyLoad
    };
}));