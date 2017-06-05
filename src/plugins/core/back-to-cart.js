import MenuItem from '../base/menu-item';

export default class BackToCart extends MenuItem {

    buttonLabel = 'cartButtonLabel'; // from translations

    get onClick () {
        return () => {
            // save bookmark in local storage so it is restored when user returns
            sessionStorage.setItem(this.viewer.id, this.viewer.bookmark);
            window.location.href = this.plugin.options.urlTemplate.replace('{RV_LAYER_LIST}', this.layers.rcsIds.toString());
        };
    }

    translations = {
        'en-CA': {
            cartButtonLabel: 'Back to Cart'
        },

        'fr-CA': {
            cartButtonLabel: 'Retour au panier'
        }
    };
}

