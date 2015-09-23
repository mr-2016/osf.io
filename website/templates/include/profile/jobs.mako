<script id="profileJobs" type="text/html">

    <div data-bind="if: mode() === 'edit'">

        <form role="form" data-bind="submit: submit, validationOptions: {insertMessages: false, messagesOnModified: false}">

            <div data-bind="sortable: {
                    data: contents,
                    options: {
                        handle: '.sort-handle',
                        containment: '#containDrag',
                        tolerance: 'pointer'
                    }
                }">

                <div>

                    <div class="well well-sm sort-handle">
                        <span>Position {{ $index() + 1 }}</span>
                        <span data-bind="visible: $parent.contentsLength() > 1">
                            [ drag to reorder ]
                        </span>
                        <a
                                class="text-danger pull-right"
                                data-bind="click: $parent.removeContent"
                                >Remove</a>
                    </div>

                    <div class="form-group">
                        <label>Institution / Employer</label>
                        <input class="form-control" data-bind="value: institution"
                            placeholder="Required"/>
                        <div data-bind="visible: $parent.showMessages, css:'text-danger'">
                            <p data-bind="validationMessage: institution"></p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Department</label>
                        <input class="form-control" data-bind="value: department" />
                    </div>

                    <div class="form-group">
                        <label>Job Title</label>
                        <input class="form-control" data-bind="value: title" />
                    </div>

                    <div class="form-group">
                        <label>Start Date</label>
                        <div class="row">
                            <div class ="col-md-3">
                                <select class="form-control" data-bind="options: months,
                                         optionsCaption: '-- Month --',
                                         value: startMonth">
                                </select>
                            </div>
                            <div class="col-md-3">
                                <input class="form-control" placeholder="Year" data-bind="value: startYear" />
                            </div>
                        </div>
                    </div>

                    <div class="form-group" data-bind="ifnot: ongoing">
                        <label>End Date</label>
                            <div class="row">
                                <div class ="col-md-3">
                                    <select class="form-control" data-bind="options: months,
                                         optionsCaption: '-- Month --',
                                         value: endMonth">
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <input class="form-control" placeholder="Year" data-bind="value: endYear" />
                                </div>
                            </div>
                    </div>


                    <div class="form-group">
                        <label>Ongoing</label>
                        <input type="checkbox" data-bind="checked: ongoing, click: clearEnd"/>
                    </div>

                    <div data-bind="visible: $parent.showMessages, css:'text-danger'">
                        <p data-bind="validationMessage: start"></p>
                        <p data-bind="validationMessage: end"></p>
                        <p data-bind="validationMessage: startYear"></p>
                        <p data-bind="validationMessage: endYear"></p>
                    </div>

                    <hr data-bind="visible: $index() != ($parent.contents().length - 1)" />

                </div>

            </div>

            <div>
                <a class="btn btn-default" data-bind="click: addContent">
                    Add another
                </a>
            </div>

            <div class="p-t-lg p-b-lg">

                <button
                        type="button"
                        class="btn btn-default"
                        data-bind="click: cancel"
                    >Discard changes</button>

                <button
                        type="submit"
                        class="btn btn-success"
                    >Save</button>

            </div>

            <!-- Flashed Messages -->
            <div class="help-block">
                <p data-bind="html: message, attr.class: messageClass"></p>
            </div>

        </form>

    </div>

    <div data-bind="if: mode() === 'view'">

        <div data-bind="ifnot: contents().length">
            <div class="well well-sm">Not provided</div>
        </div>

        <div class="row" data-bind="if: contents().length">

            <div data-bind="foreach: contents">
                <div class="col-sm-12 col-xs-6">
                    <div class="panel panel-default">
                        <div class="panel-heading" data-bind="attr: {id: 'jobHeading' + $index()}">
                            {{ institution }}
                            <a data-bind="attr: {href: '#jobCard' + $index()}" role="button" data-toggle="collapse" aria-controls="card" aria-expanded="false" style="float: right" onclick="toggleIcon(this)">
                                <i class="glyphicon glyphicon-chevron-down"></i>
                            </a>
                        </div>
                        <div data-bind="attr: {id: 'jobCard' + $index()}" class="panel-collapse collapse" data-bind="attr: {aria-labelledby: 'jobHeading' + $index()}">
                            <div class="panel-body">
                                <span style="display: block" data-bind="if: department().length"><h5>Department:</h5> {{ department }}</span>
                                <span style="display: block" data-bind="if: title().length"><h5>Title:</h5> {{ title }}</span>
                                <span style="display: block" data-bind="if: startYear().length">
                                    <span><h5>Dates:</h5> {{ startMonth }} {{startYear }} - {{ endView }}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div data-bind="if: editable">
            <a class="btn btn-default" data-bind="click: edit">Edit</a>
        </div>

    </div>

</script>
