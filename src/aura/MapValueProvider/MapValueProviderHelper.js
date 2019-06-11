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
        let valueProvider = helper.getValueProvider(component);

        helper.forEach(body, cmpDefRef => {
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
        const valueProviderDefs = valueProvider.getDef().getAttributeDefs();
        const cmpDefDescriptor = componentDefRef.componentDef.descriptor;

        for (let tempKey in values) {

            const tempValue = values[tempKey];

            if (tempKey === 'body' || !tempValue.value.path) {
                continue;
            }

            let path = helper.getPathAsString(tempValue.value.path);

            let pathSuffix = tempValue.varName === varName ?
                helper.getPathSuffix(path, mapFullPath + previousKey)
                :
                helper.getPathSuffix(path, varName);

            if (pathSuffix !== null) {
                tempValue.value = valueProvider.getReference(mapFullPath + key + pathSuffix);
                tempValue.varName = tempValue.varName ? tempValue.varName : varName;
            } else if (path.match(/^v\./)) {
                if (valueProviderDefs.getDef(path.substring(2, path.length))) {
                    tempValue.value = valueProvider.getReference(path);
                }
            }
        }

        //if componentDefRef is MapValueProvider, inject global id
        //of the highest ParentMapValueProvider
        if (values.map && cmpDefDescriptor === 'markup://' + component.getType()) {
            let superId = component.get('v.superId');
            values.superId = superId ? superId : {value: component.getGlobalId()}
        }

        //if componentDefRef contains body, set all body values
        if (values.body) {
            helper.forEach(values.body.value, cmpDefRef => {
                helper.setChildComponentDefRef(component, cmpDefRef, valueProvider, previousKey);
            })
        }
    },

    getMapFullPath: function (component, valueProvider) {
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

    getValueProvider: function (component) {
        let superId = component.get('v.superId.value');
        if (superId) {
            return this.getValueProviderFromBody($A.getComponent(superId));
        }
        return this.getValueProviderFromBody(component);
    },

    getValueProviderFromBody: function (component) {
        let componentDefRef = component.get('v.body')[0];
        return componentDefRef.attributes.valueProvider;
    },
})