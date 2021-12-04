
class Helper_DND5E {
    /**
     * 
     * @param {TokenActorDocument} actor 
     * @returns {String}
     */
    static async getActorCR (tokenActor) {
        return await game.actors.find(actor => actor._id === tokenActor.data.actorId).data.data.details.cr;
    }
}
export default Helper_DND5E;