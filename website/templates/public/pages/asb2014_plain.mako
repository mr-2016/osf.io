<html>

<head>

    <title>ASB Presentations 2014</title>

    <%namespace name="globals" file="base.mako" />
    ${globals.includes_top()}}

    % for url in js_bottom:
        <script src="${url}"></script>
    % endfor

</head>

<body>

    <div class="container">

        <h2 style="padding-bottom: 30px;">ASB 2014 Posters & Talks</h2>
        <div><a href="http://cos.io/spsp/" target="_blank">Add your poster or talk</a></div>
        <div style="padding-bottom: 30px;">Search results by title or author: <input id="gridSearch" /></div>
        <div id="grid" style="width: 100%;"></div>

    </div>

    <script type="text/javascript" src="/static/js/conference.js"></script>
    <script type="text/javascript">
        var data = ${data}
        new Meeting.Meeting(data);
    </script>

</body>

</html>
