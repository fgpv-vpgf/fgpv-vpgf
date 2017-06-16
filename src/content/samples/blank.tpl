<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta content="width=device-width,initial-scale=1" name="viewport">
        <title>Blank Test Page</title>

        <% for (var index in htmlWebpackPlugin.files.css) { %>
            <% if (webpackConfig.output.crossOriginLoading) { %>
                <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" integrity="<%= htmlWebpackPlugin.files.cssIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"/>
            <% } else { %>
                <link rel="stylesheet" href="<%= htmlWebpackPlugin.files.css[index] %>" />
            <% } %>
        <% } %>
    </head>
s
    <body>
    <% for (var index in htmlWebpackPlugin.files.js) { %>
        <% if (webpackConfig.output.crossOriginLoading) { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>" integrity="<%= htmlWebpackPlugin.files.jsIntegrity[index] %>" crossorigin="<%= webpackConfig.output.crossOriginLoading %>"></script>
        <% } else { %>
            <script src="<%= htmlWebpackPlugin.files.js[index] %>"></script>
        <% } %>
    <% } %>
    </body>
</html>
