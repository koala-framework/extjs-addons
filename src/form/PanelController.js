Ext.define('Densa.form.PanelController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.densa.form',

    mixins: {
        saveable: 'Densa.viewController.Saveable'
    },

    config: {
        control: {
            '#deleteButton': {
                click: 'onDeleteClick'
            }
/*
            ,
            '#saveButton': {
                click: 'onSaveClick'
            }
*/
        }
    },

    deleteConfirmText: 'Do you really wish to remove this entry?',
    deleteConfirmTitle: 'Delete',
    saveValidateErrorTitle: 'Save',
    saveValidateErrorMsg: "Can't save, please fill all marked fields correctly.",

    init: function()
    {
        if (!this.getView().getSession()) {
            this.getViewModel().setSession(this.getView().lookupSession());
        }
        this.callParent(arguments);
    },
/*
    onSaveClick: function()
    {
        if (!this.getView().isValid()) {
            Ext.Msg.alert(this.saveValidateErrorTitle, this.saveValidateErrorMsg);
            return;
        }
        var s;
        if (this.getView().getSession()) {
            this.getView().getSession().save();
            s = this.getView().getSession().getParent();
        } else {
            s = this.getView().lookupSession();
        }
        var batch = s.getSaveBatch();
        if (batch) {
            batch.start();
        }
    },
*/
    onDeleteClick: function()
    {
        Ext.Msg.show({
            title: this.deleteConfirmTitle,
            msg: this.deleteConfirmText,
            buttons: Ext.Msg.YESNO,
            scope: this,
            fn: function(button) {
                if (button == 'yes') {
                    var row = this.getViewModel().get('record');
                    if (row) {
                        row.drop();
                    }
                    var s;
                    if (this.getView().getSession()) {
                        this.getView().getSession().save();
                        s = this.getView().getSession().getParent();
                    } else {
                        s = this.getView().lookupSession();
                    }
                    var batch = s.getSaveBatch();
                    if (batch) {
                        batch.start();
                    }
                }
            }
        });
    },
/*
    mixins: {
        bindable: 'Densa.mvc.bindable.Interface'
    },

    updateOnChange: false,
    focusOnAddSelector: 'field',
    autoLoadComboBoxStores: true,

    autoSync: true,

    optionalControl: {

        saveButton: {
            selector: 'button#saveButton',
            listeners: {
                click: 'onSaveClick'
            }
        },
        deleteButton: {
            selector: 'button#deleteButton',
            listeners: {
                click: 'onDeleteClick'
            }
        }

    },

    init: function()
    {
        if (!this.view) Ext.Error.raise('view is required');
        if (!(this.view instanceof Ext.form.Panel)) Ext.Error.raise('view needs to be a Ext.form.Panel');

        this.view.getForm().trackResetOnLoad = true;

        if (this.updateOnChange) {
            Ext.each(this.view.query('field'), function(i) {
                i.on('change', function() {
                    this.view.updateRecord();
                }, this);
            }, this);
        }
    },

    _onStoreWrite: function()
    {
        if (this.getLoadedRecord()) {
            this.load(this.getLoadedRecord(), this._loadedStore);
        }
    },

    //store is optional, used for sync
    load: function(row, store)
    {
        if (this.view.isDisabled()) {
            Ext.Error.raise('Can\'t load into disabled form');
        }
        if (this._loadedStore) this._loadedStore.un('write', this._onStoreWrite, this);
        this._loadedStore = store;
        if (this._loadedStore) this._loadedStore.on('write', this._onStoreWrite, this);

        if (this.autoLoadComboBoxStores) {
            Ext.each(this.view.query("combobox"), function(i) {
                if (i.getName() != '' && !!row.get(i.getName()) && i.queryMode == 'remote' && i.store) {
                    i.store.addFilter({
                        id: 'densaFormComboboxFilterId',
                        property: i.valueField,
                        value: row.get(i.getName())
                    }, false);
                    i.store.load();
                    i.store.filters.removeAtKey('densaFormComboboxFilterId');
                    delete i.lastQuery;
                }
            }, this);
            Ext.each(this.view.query('multiselectfield'), function(i) {
                if (i.store && !i.store.lastOptions) {
                    i.store.load();
                }
            }, this);
        }

        //when loading the same row (by comparing the id) keep dirty values
        var keepDirtyValues = this.view.getForm()._record
            && this.view.getForm()._record.getId() == row.getId();

        this.view.getForm()._record = row;

        // Suspend here because setting the value on a field could trigger
        // a layout, for example if an error gets set, or it's a display field
        Ext.suspendLayouts();
        Ext.iterate(row.getData(), function(fieldId, val) {
            var field = this.view.getForm().findField(fieldId);
            if (field) {
                if (keepDirtyValues && field.isDirty()) {
                    return;
                }
                field.setValue(val);
                field.resetOriginalValue();
            }
        }, this);
        Ext.resumeLayouts(true);
    },

    onSaveClick: function()
    {
        this.allowSave().then({
            success: function() {
                if (this._loadedStore) {
                    this.save();
                    if (this.autoSync) {
                        this._loadedStore.sync({
                            success: function() {
                                this.fireViewEvent('savesuccess');
                            },
                            scope: this
                        });
                    }
                } else {
                    if (this.autoSync) {
                        this.validateAndSubmit();
                    } else {
                        Ext.Error.raise("Can't save if autoSync is disabled and store was not provided");
                    }
                }
            },
            scope: this
        });
    },
    onDeleteClick: function()
    {
        this.allowDelete().then({
            success: function() {
                if (this.autoSync) {
                    Ext.Msg.show({
                        title: this.deleteConfirmTitle,
                        msg: this.deleteConfirmText,
                        icon: Ext.MessageBox.QUESTION,
                        buttons: Ext.Msg.YESNO,
                        scope: this,
                        fn: function(button) {
                            if (button == 'yes') {
                                if (this._loadedStore) {
                                    this._loadedStore.remove(this.getLoadedRecord());
                                    this._loadedStore.sync();
                                } else {
                                    this.getLoadedRecord().destory();
                                    this.disable();
                                }
                            }
                        }
                    });
                } else {
                    if (this._loadedStore) {
                        this._loadedStore.remove(this.getLoadedRecord());
                    } else {
                        Ext.Error.raise("Can't delete if autoSync is disabled and store was not provided");
                    }
                }
            },
            scope: this
        });
    },

    validateAndSubmit: function(options)
    {
        return this.allowSave().then({
            success: function() {

                this.save();

                this.getLoadedRecord().save({
                    success: function() {
                        this.fireViewEvent('savesuccess', this.getLoadedRecord());
                        if (!this._loadedStore) {
                            //if we don't have a store we can't listen to 'write' event
                            this.load(this.getLoadedRecord());
                        }
                        if (options && options.success) {
                            options.success.call(options.scope || this);
                        }
                    },
                    failure: function() {
                        if (options && options.failure) {
                            options.failure.call(options.scope || this);
                        }
                    },
                    scope: this
                });
            },
            scope: this
        });
    },

    save: function(syncQueue)
    {
        if (!this.view.getRecord()) return;

        this.view.updateRecord();

        //trackResetOnLoad only calls resetOriginalValue on load, not on updateRecord
        Ext.each(this.view.getRecord().fields.items, function(field) {
            var f = this.view.getForm().findField(field.name);
            if (f) {
                f.resetOriginalValue();
            }
        }, this);
    },

    getLoadedRecord: function()
    {
        return this.view.getRecord();
    },

    reset: function()
    {
        this.view.getForm().reset(true);
    },


    enable: function()
    {
        this.view.enable();
    },
    disable: function()
    {
        this.view.getForm()._record = null;
        Ext.each(this.view.query('field'), function(i) {
            i.setValue(null);
            i.resetOriginalValue();
        }, this);
        this.view.disable();
    },
    getPanel: function()
    {
        return this.view;
    },

    onAdd: function()
    {
        if (this.focusOnAddSelector) {
            this.view.down(this.focusOnAddSelector).focus();
            return true;
        }
    },
*/

    isDirty: function()
    {
        //form syncs to session, so it can be considerd as not dirty
        return false;
    },

    isValid: function()
    {
        return this.getView().getForm().isValid();
    },

    allowSave: function()
    {
        if (!this.isValid()) {
            Ext.Msg.alert(this.saveValidateErrorTitle, this.saveValidateErrorMsg);
            return Deft.promise.Deferred.reject();
        }
        return this.mixins.saveable.allowSave.call(this);
    }
});
