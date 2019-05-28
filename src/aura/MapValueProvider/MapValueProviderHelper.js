({

    setNewBody: function (component) {
        try {
            let bodyCmps = this.getBodyCmps(component);
            if (!bodyCmps) {
                return
            }
            $A.createComponents(bodyCmps, function (newBody) {
                component.set('v.newBody', newBody);
            })
        } catch (e) {
            console.error(e)
        }
    },

    getBodyCmps: function (component) {
        // if (this.isValueNotUpdated(component)) {
        //     return;
        // }

        if (!component.get('v.map') || !component.get('v.key')) {
            return;
        }

        let previousKey = component.get('v.previousKey') //todo

        if (previousKey === component.get('v.key')) {
            return;
        }

        component.set('v.previousKey', component.get('v.key'))

        return this.generateTemplateElements(component, previousKey);
    },

    generateTemplateElements: function (component, previousKey) {
        let helper = this;
        let newCmps = [];

        helper.forEach(component.get('v.body'), cmpDefRef => {
            let valueProvider = helper.getValueProvider(cmpDefRef);
            helper.setChildComponentDefRef(component, cmpDefRef, valueProvider, component.get('v.var'), previousKey);
            let newCmp = helper.genNewCmp(cmpDefRef);
            newCmps.push(newCmp);
        })

        return newCmps;
    },

    setChildComponentDefRef: function (component, componentDefRef, valueProvider, varName, previousKey) {
        let helper = this;
        let values = componentDefRef.attributes.values;
        let key = component.get('v.key');

        for (let tempKey in values) {

            let tempValue = values[tempKey];
            let tempPath = tempValue.value.path;
            let path = helper.getConvertedPath(tempPath);
            let isVarNameInPath = helper.isVarNameInPath(path, varName);

            if (tempKey !== 'body' && !tempPath && typeof(tempValue.value) === 'object') {
                let ref = tempValue.value.toString();
                path = ref.substring(ref.indexOf('{!')+2, ref.indexOf('}'));
                if (path == 'v.map.' + previousKey) {
                    component.set(path.replace(varName, 'v.map[' + key + ']'), component.getReference(path.replace(varName, 'v.map[' + key + ']')))
                }
                continue
            }

            if (tempKey === 'body' || !path || (Array.isArray(tempPath) && !isVarNameInPath)) {
                continue;
            }

            if (isVarNameInPath) {
                tempValue.value = component.getReference(path.replace(varName, 'v.map[' + key + ']'));
            } else if (valueProvider) {
                tempValue.value = valueProvider.getReference(path);
            }
        }

        if (values.body) {
            helper.forEach(values.body.value, cmpDefRef => {
                helper.setChildComponentDefRef(component, cmpDefRef, valueProvider, varName, previousKey);
            })
        }
    },

    genNewCmp: function(cmpDefRef) {
        let cmpDef = cmpDefRef.componentDef.descriptor;
        let cmpValues = cmpDefRef.attributes.values;

        return [cmpDef, cmpValues];
    },

    getConvertedPath: function(tempPath) {
        if (tempPath) {
            return Array.isArray(tempPath) ? tempPath.join('.') : tempPath;
        }
    },

    isVarNameInPath: function (path, varName) {
        if (path) {
            return path.split('.')[0] === varName;
        }
    },

    isValueNotUpdated: function (component) {
        let value = this.fetchMapValue(component);
        let oldValue = component.get('v.returnValue');

        if (this.isValuesAreSame(value, oldValue)) {
            return true;
        }

        // component.set('v.returnValue', value);
    },

    isValuesAreSame: function (value, oldValue) {
        if (oldValue === null) {
            oldValue = undefined;
        }

        return JSON.stringify(oldValue) === JSON.stringify(value);
    },

    forEach: function (arr, func) {
        if (!Array.isArray(arr)) {
            throw Error('Error: Passed element is not an Array');
        }
        for (let i = 0; i < arr.length; i++) {
            func(arr[i]);
        }
    },

    fetchMapValue: function (component) {
        let map = component.get('v.map');
        let key = component.get('v.key');

        return this.getValue(map, key, component);
    },

    getValue: function (map, key, component) {
        if (map && key) {
            return (map instanceof Map) ? map.get(key) : map[key];
            // return component.getReference('v.map[' + key + ']');
        }
    },

    getValueProvider: function (componentDefRef) {
        return componentDefRef.attributes.valueProvider;
    }
})