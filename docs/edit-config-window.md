# Edit Config Window

![Edit Config Window](images/eidt_config_window.png)

This window shows all the properties of this config and also all the properties it inherits.
![Edit config property](images/edit_config_property.png)

There is the property name and <br>
**A**: Current value of the property <br>
**B**: The config this property is inherited from. It says `base` if the property is defined in this config<br>
**C**: The level of inheritance. `0` for `base` and then increases its way up the inheritance tree.
**D**: Edit the config this property is inherited from
**E**: Only appears for properties with array values and adds another value to the array

When you change a property it becomes highlighted<br>
![Highlighted property](images/edit_config_property_reset.png)<br>
It will show you this reset button to reset this property to the previous value.

### Top Buttons

![Top Buttons](images/edit_config_top_buttons.png)<br>
The top of the edit config window shows a few buttons. These are `Open containing folder`, `Save changes` and `Reset all` respectively. These are self explanatory.

### New Property

![New Property](images/edit_config_new_property.png)<br>
You can use this part at the bottom of the page to create a new property<br>
**A**: Select whether the new property is a single `value` or `array`<br>
**B**: Name for the new property. When you start entering a name, it will show you a list of all properties the manager recognizes. <br>
**C**: The value for this property. As you start to fill it, it will show you some possible values if it can find them.
**D**: Add button, adds it to the config
