# MapValueProvider
This component is used for dynamicly binding to temporary variable map value for specific key

Example of using this component:
```
<c:MapValueProvider map="{!v.map}" key="{!v.key1}" var="innerMap">

      <!--You can use as inner MapValueProvider to get value of inner map-->
      <c:MapValueProvider map="{!innerMap}" key="language" var="value">
             {!value}
      </c:MapValueProvider>

      <!--You can also get value by some path in temporary variable-->
      {!innerMap.language}">

</c:MapValueProvider>
```
     
This component has handler that checks if key was changed and reloads value for specific map.
