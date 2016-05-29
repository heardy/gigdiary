$().ready(function() {
    $('.delete-gig').click(function(e) {
        var doDelete = window.confirm('Are you sure you want to delete?')
        if (!doDelete) {
            e.preventDefault();
            return false;
        }
    });
});
