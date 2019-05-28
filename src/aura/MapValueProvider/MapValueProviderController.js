({
    setNewBody: function (component, event, helper) {
        helper.setNewBody(component);
    },

    valueChanged: function(component) {
        // alert('value changed');
        // let map = component.get('v.map');
        let key = component.get('v.key');
        let value = component.get('v.returnValue');

        component.set('v.map[' + key + ']', value);
    }
})


