({

    setNewBody: function (component) {
        try {
            let bodyCmps = this.getBodyCmps(component);
            if (!bodyCmps || bodyCmps.length === 0) {
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
        let previousKey = component.get('v.previousKey');
        //overrides previous key to current
        component.set('v.previousKey', component.get('v.key'))

        return this.generateTemplateElements(component, previousKey);
    },

    generateTemplateElements: function (component, previousKey) {
        let helper = this;
        let newCmps = [];

        let body = component.get('v.body');

        if (body.length === 0) {
            return;
        }
        let valueProvider = component.get('v.valueProvider.value') ? component.get('v.valueProvider.value') : helper.getValueProvider(body[0]);

        helper.forEach(component.get('v.body'), cmpDefRef => {
            helper.setChildComponentDefRef(component, cmpDefRef, valueProvider, previousKey);
            let newCmp = helper.genNewCmp(cmpDefRef);
            newCmps.push(newCmp);
        })

        return newCmps;
    },

    setChildComponentDefRef: function (component, componentDefRef, valueProvider, previousKey) {
        const helper = this;
        const values = componentDefRef.attributes.values;
        const varName = component.get('v.var');
        const key = component.get('v.key');
        const mapFullPath = helper.getMapFullPath(component, valueProvider);
        const valueProviderDefs = !component.get('v.mapFullPath.value') ? valueProvider.getDef().getAttributeDefs() : null;

        for (let tempKey in values) {

            let tempValue = values[tempKey];
            let path = helper.getPathAsString(tempValue.value.path);

            //if such tempValue is already reffered to real value,
            // we need to check if such path was changed when key was changed
            if (tempKey !== 'body' && !path && typeof (tempValue.value) === 'object') {
                if (!tempValue.value.getExpression) {
                    //get first {!<path>} from path
                    let ref = tempValue.value.toString().match(/\{\!(.*?)\}/);
                    path = ref ? ref[1] : path;
                }
                let pathSuffix = helper.getPathSuffix(path, mapFullPath + previousKey);
                if (pathSuffix !== null) {
                    tempValue.value = valueProvider.getReference(mapFullPath + key + pathSuffix);
                    continue
                }
            }

            if (tempKey === 'body' || !path) {
                continue;
            }

            let pathSuffix = helper.getPathSuffix(path, varName);

            if (pathSuffix !== null) {
                // let provider = valueProvider ? valueProvider : component;
                tempValue.value = valueProvider.getReference(mapFullPath + key + pathSuffix);
                continue;
            }

            if (valueProviderDefs && path.match(/^v\./)) {
                if (valueProviderDefs.getDef(path.substring(2, path.length))) {
                    tempValue.value = valueProvider.getReference(path);
                }
            }
        }

        //if componentDefRef is MapValueProvider, inject mapFullPath and valueProvider
        if (values.map && componentDefRef.componentDef.descriptor === 'markup://' + component.getType()) {
            values.mapFullPath = {value: mapFullPath + key}

            if (!values.valueProvider) {
                values.valueProvider = {value: valueProvider}
            }
        }

        //if componentDefRef contains body, set all body values
        if (values.body) {
            helper.forEach(values.body.value, cmpDefRef => {
                helper.setChildComponentDefRef(component, cmpDefRef, valueProvider, previousKey);
            })
        }
    },

    getMapFullPath: function (component, valueProvider) {
        let mapFullPath = component.get('v.mapFullPath.value');
        if (mapFullPath) {
            return mapFullPath + '.';
        }

        return this.getMapFullPathFromValueProvider(component, valueProvider) + '.';
    },

    getMapFullPathFromValueProvider: function (component, valueProvider) {
        let globalId = component.getGlobalId();
        let componentReference = valueProvider.getReference(globalId);

        return componentReference.wb.t.A.map.getExpression();
    },

//if tempPath in path return pathSuffix array
    getPathSuffix: function (path, tempPath) {
        let match = path ? path.replace(tempPath, '').match(/^$|^\./) : null;
        return match ? match.input : null;
    },

    genNewCmp: function (cmpDefRef) {
        let cmpDef = cmpDefRef.componentDef.descriptor;
        let cmpValues = cmpDefRef.attributes.values;

        return [cmpDef, cmpValues];
    },

    getPathAsString: function (tempPath) {
        if (tempPath) {
            return Array.isArray(tempPath) ? tempPath.join('.') : tempPath;
        }
    },

    forEach: function (arr, func) {
        if (!Array.isArray(arr)) {
            throw Error('Error: Passed element is not an Array');
        }
        for (let i = 0; i < arr.length; i++) {
            func(arr[i]);
        }
    },

    getValueProvider: function (componentDefRef) {
        return componentDefRef.attributes.valueProvider;
    }
    },
})